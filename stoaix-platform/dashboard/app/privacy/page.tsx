export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Gizlilik Politikası & KVKK Aydınlatma Metni</h1>
      <p className="text-xs text-slate-400 mb-1">Privacy Policy & KVKK Disclosure Notice</p>
      <p className="text-sm text-slate-400 mb-8">Son güncelleme / Last updated: 15 Nisan 2026</p>

      <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">

        {/* ─── KVKK Section ─── */}
        <section className="bg-sky-50 border border-sky-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-sky-800 mb-2">KVKK Aydınlatma Metni (6698 Sayılı Kanun Madde 10)</h2>
          <p className="text-slate-700">
            Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) çerçevesinde,
            aşağıda açıklanan kapsamda işlenmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">1. Veri Sorumlusu</h2>
          <p className="text-slate-600">
            <strong>stoaix</strong> — İletişim: <a href="mailto:privacy@stoaix.com" className="text-blue-600 underline">privacy@stoaix.com</a>
            <br />Platform: platform.stoaix.com
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">2. İşlenen Kişisel Veriler</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Kimlik verileri:</strong> Ad, soyad, e-posta adresi</li>
            <li><strong>İletişim verileri:</strong> Telefon numarası</li>
            <li><strong>İşlem verileri:</strong> Randevu bilgileri, konuşma geçmişi, AI asistan etkileşimleri</li>
            <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı bilgisi, oturum verileri</li>
            <li><strong>Takvim verileri:</strong> Google Takvim bağlantısı kurulduğunda takvim etkinlikleri</li>
          </ul>
          <p className="text-slate-500 mt-2 text-xs">
            Not: AI asistan üzerinden işlenen hasta/müşteri sağlık verileri "özel nitelikli kişisel veri"
            kapsamında değerlendirilebilir. Bu veriler için açık rıza alınmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">3. İşleme Amaçları ve Hukuki Dayanaklar</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-slate-200 rounded-lg">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-3 py-2 text-left">Amaç</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">Hukuki Dayanak (KVKK Md. 5-6)</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="border border-slate-200 px-3 py-2">Platform hizmetinin sağlanması</td>
                  <td className="border border-slate-200 px-3 py-2">Sözleşmenin ifası (Md. 5/2-c)</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-200 px-3 py-2">AI asistan konuşmalarının işlenmesi</td>
                  <td className="border border-slate-200 px-3 py-2">Açık rıza (Md. 5/1, Md. 6/2)</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-3 py-2">Güvenlik ve sistem yönetimi</td>
                  <td className="border border-slate-200 px-3 py-2">Meşru menfaat (Md. 5/2-f)</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-200 px-3 py-2">Faturalandırma ve ödeme</td>
                  <td className="border border-slate-200 px-3 py-2">Sözleşmenin ifası (Md. 5/2-c)</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-3 py-2">Pazarlama iletişimleri</td>
                  <td className="border border-slate-200 px-3 py-2">Açık rıza (Md. 5/1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">4. Veri Aktarımı</h2>
          <p className="text-slate-600 mb-2">
            Kişisel verileriniz yalnızca hizmetin sağlanması için aşağıdaki alıcılara aktarılmaktadır:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Supabase Inc.</strong> (veritabanı, AB SCC kapsamında)</li>
            <li><strong>Vercel Inc.</strong> (hosting, AB SCC kapsamında)</li>
            <li><strong>Stripe Inc.</strong> (ödeme işleme, AB SCC kapsamında)</li>
            <li><strong>Anthropic / OpenAI</strong> (AI işleme, AB SCC kapsamında)</li>
          </ul>
          <p className="text-slate-500 mt-2 text-xs">
            AB Standart Sözleşme Hükümleri (SCC) kapsamında yurt dışına aktarım yapılmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">5. Saklama Süresi</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Hesap verileri: Hesap silme tarihinden itibaren <strong>90 gün</strong></li>
            <li>Finansal kayıtlar: Vergi mevzuatı gereği <strong>10 yıl</strong></li>
            <li>Konuşma geçmişi: Hesap aktif olduğu sürece</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">6. KVKK Madde 11 Haklarınız</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Kişisel verilerinizin işlenip işlenmediğini <strong>öğrenme</strong></li>
            <li>İşlenmişse buna ilişkin <strong>bilgi talep etme</strong></li>
            <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını <strong>öğrenme</strong></li>
            <li>Verilerin <strong>düzeltilmesini</strong> isteme</li>
            <li>Koşullar dahilinde verilerin <strong>silinmesini</strong> isteme</li>
            <li>İşleme itiraz etme ve <strong>zararın giderilmesini</strong> talep etme</li>
          </ul>
          <p className="text-slate-600 mt-3">
            Başvurularınız için:{' '}
            <a href="mailto:privacy@stoaix.com" className="text-blue-600 underline">privacy@stoaix.com</a>
            {' '}veya platform üzerinden Dashboard → Ayarlar → Gizlilik
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">7. Google Takvim Entegrasyonu</h2>
          <p className="text-slate-600">
            Google Takvim bağlandığında yalnızca randevu oluşturma ve görüntüleme kapsamında
            <strong> calendar.events</strong> ve <strong>calendar.readonly</strong> izinleri kullanılır.
            Takvim verileriniz üçüncü taraflarla paylaşılmaz. Erişimi istediğiniz zaman{' '}
            <a href="https://myaccount.google.com/permissions" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              myaccount.google.com/permissions
            </a>{' '}
            adresinden iptal edebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">8. Güvenlik</h2>
          <p className="text-slate-600">
            Tüm veriler Supabase PostgreSQL üzerinde satır düzeyinde güvenlik (RLS) ile korunmaktadır.
            OAuth token'ları şifrelenmiş olarak saklanmaktadır. TLS/HTTPS ile iletim güvenliği sağlanmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">9. İletişim & Şikayet</h2>
          <p className="text-slate-600">
            Gizlilik ile ilgili sorularınız için:{' '}
            <a href="mailto:privacy@stoaix.com" className="text-blue-600 underline">privacy@stoaix.com</a>
          </p>
          <p className="text-slate-600 mt-2">
            KVKK kapsamındaki şikayetlerinizi ayrıca{' '}
            <a href="https://www.kvkk.gov.tr" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Kişisel Verileri Koruma Kurumu (KVKK)
            </a>
            &apos;na iletebilirsiniz.
          </p>
        </section>

        {/* ─── English Summary ─── */}
        <section className="border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-700 mb-2">English Summary</h2>
          <p className="text-slate-600">
            stoaix operates under Turkish KVKK (Personal Data Protection Law No. 6698). We collect account,
            business, conversation, and technical data to provide our AI assistant platform. Data is stored on
            Supabase (PostgreSQL with RLS), hosted on Vercel, and processed with AI providers (Anthropic/OpenAI),
            all under EU Standard Contractual Clauses. You have rights to access, correct, and delete your data.
            Contact: <a href="mailto:privacy@stoaix.com" className="text-blue-600 underline">privacy@stoaix.com</a>
          </p>
        </section>

      </div>
    </div>
  )
}
