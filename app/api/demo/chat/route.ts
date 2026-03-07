import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import {
  buildAnalysisMessages,
  buildReplySystemPrompt,
  calculateScore,
  type SessionState,
  type AnalysisResult,
  type CollectedData,
  type LeadSignals,
  type Stage,
} from '@/lib/demo/claude-demo';
import type { Lang } from '@/lib/i18n/messages';

// Use service-role for demo clinic read (no user auth in demo)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      history = [],
      lang = 'tr',
      sessionState,
    }: {
      message: string;
      history: { role: 'user' | 'assistant'; content: string }[];
      lang: Lang;
      sessionState: SessionState;
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    // ── Fetch demo clinic data ─────────────────────────────────────────────────
    const clinicId = process.env.DEMO_CLINIC_ID;
    if (!clinicId) {
      return NextResponse.json({ error: 'DEMO_CLINIC_ID not configured' }, { status: 500 });
    }

    const [{ data: clinic }, { data: services }, { data: faqs }] = await Promise.all([
      supabase.from('clinics').select('*').eq('id', clinicId).single(),
      supabase.from('clinic_services').select('name, description, price_range').eq('clinic_id', clinicId).eq('is_active', true),
      supabase.from('clinic_faqs').select('question, answer').eq('clinic_id', clinicId).eq('is_active', true),
    ]);

    if (!clinic) {
      return NextResponse.json({ error: 'Demo clinic not found' }, { status: 404 });
    }

    // ── Step 1: Analysis ───────────────────────────────────────────────────────
    const analysisMessages = buildAnalysisMessages(
      { name: clinic.name, clinic_type: clinic.clinic_type },
      services || [],
      faqs || [],
      history,
      message,
      sessionState,
      lang,
    );

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: analysisMessages,
    });

    let analysisResult: any = null;
    const rawAnalysis = analysisResponse.choices[0]?.message?.content ?? '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch =
      rawAnalysis.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      rawAnalysis.match(/(\{[\s\S]*\})/);
    try {
      const jsonStr = jsonMatch ? jsonMatch[1] : rawAnalysis;
      const parsed = JSON.parse(jsonStr.trim());
      const meta = parsed.metadata || {};
      analysisResult = {
        currentStage: (meta.current_stage || sessionState.currentStage) as Stage,
        collectedData: { ...sessionState.collectedData, ...(meta.collected_data || {}) } as CollectedData,
        leadSignals: { ...sessionState.leadSignals, ...(meta.lead_signals || {}) } as LeadSignals,
        handoffRecommended: meta.handoff_recommended || false,
        handoffReason: meta.handoff_reason || null,
        replyGuidance: parsed.reply_guidance || '',
      } satisfies AnalysisResult;
    } catch {
      // Analysis parse failed — use current state
      analysisResult = {
        currentStage: sessionState.currentStage,
        collectedData: sessionState.collectedData,
        leadSignals: sessionState.leadSignals,
        handoffRecommended: false,
        handoffReason: null,
        replyGuidance: '',
      } satisfies AnalysisResult;
    }

    // ── Step 2: Score ──────────────────────────────────────────────────────────
    const { score, breakdown } = calculateScore(
      analysisResult.collectedData,
      analysisResult.leadSignals,
    );

    const handoffRecommended = analysisResult.handoffRecommended || score >= 70;

    // ── Step 3: Reply ──────────────────────────────────────────────────────────
    const replySystemPrompt = buildReplySystemPrompt(
      clinic,
      services || [],
      faqs || [],
      lang,
    );

    const guidanceNote = analysisResult.replyGuidance
      ? `\n\n[INTERNAL GUIDANCE: ${analysisResult.replyGuidance}]`
      : '';

    const replyResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      messages: [
        { role: 'system', content: replySystemPrompt + guidanceNote },
        ...history,
        { role: 'user', content: message },
      ],
    });

    const reply = replyResponse.choices[0]?.message?.content ?? '...';

    // ── Return ─────────────────────────────────────────────────────────────────
    return NextResponse.json({
      reply,
      stage: analysisResult.currentStage,
      collectedData: analysisResult.collectedData,
      leadSignals: analysisResult.leadSignals,
      score,
      scoreBreakdown: breakdown,
      handoffRecommended,
      replyGuidance: analysisResult.replyGuidance,
    });
  } catch (err: any) {
    console.error('[demo/chat]', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
