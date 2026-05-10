export default function PrivacyPolicyPage() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-6">Privacy Policy</h1>
      <p className="text-xs text-t3 mb-6">Last updated: 10 May 2026</p>

      <div className="prose prose-sm text-t2 space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">1. Introduction</h2>
          <p>OverBerg Go (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a mobile and web platform operated by Heferon (Pty) Ltd, providing on-demand food delivery, ride-hailing, grocery delivery, pharmacy delivery, parcel delivery, laundry services, and home services in the Overberg region, Western Cape, South Africa.</p>
          <p>This policy explains how we collect, use, store, and protect your personal information in compliance with the Protection of Personal Information Act, 2013 (POPIA).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">2. Information We Collect</h2>
          <p><strong>Account information:</strong> Name, email address, phone number, profile photo.</p>
          <p><strong>Location data:</strong> GPS coordinates when using ride, delivery, or service features. We only access location when the app is in active use or during an active trip/delivery.</p>
          <p><strong>Order data:</strong> Items ordered, delivery addresses, payment information, order history.</p>
          <p><strong>Device information:</strong> Device type, operating system, push notification tokens, app version.</p>
          <p><strong>KYC documents (drivers/vendors):</strong> South African ID, driver&apos;s licence, vehicle registration, business registration certificates.</p>
          <p><strong>Prescription images (pharmacy):</strong> Uploaded prescription photos for pharmacist verification.</p>
          <p><strong>Photos (home services):</strong> Photos uploaded when posting service requests.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process and deliver your orders</li>
            <li>Match you with drivers, vendors, or service providers</li>
            <li>Process payments via PayFast and GoWallet</li>
            <li>Send order updates via push notifications, SMS, email, and WhatsApp</li>
            <li>Verify driver and vendor identities (KYC)</li>
            <li>Improve our services through usage analytics</li>
            <li>Detect and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">4. Data Sharing</h2>
          <p>We share your information only as necessary:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Drivers/providers:</strong> Your name, delivery address, and phone number to fulfil orders</li>
            <li><strong>Payment processors:</strong> PayFast for card payments</li>
            <li><strong>Communication providers:</strong> Twilio (SMS), Brevo (email), Meta (WhatsApp) for notifications</li>
            <li><strong>Cloud infrastructure:</strong> Supabase (database), Vercel (hosting), Firebase (push notifications)</li>
            <li><strong>Law enforcement:</strong> When required by law or court order</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">5. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Order history is retained for 3 years for tax and dispute purposes. KYC documents are retained for the duration of the driver/vendor relationship plus 1 year. You may request deletion at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">6. Your Rights (POPIA)</h2>
          <p>Under POPIA, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Withdraw consent for marketing communications</li>
            <li>Lodge a complaint with the Information Regulator</li>
          </ul>
          <p>To exercise these rights, use the &quot;Delete Account&quot; option in Settings, or email <strong>privacy@overberggo.co.za</strong>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">7. Security</h2>
          <p>We protect your data using:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>TLS encryption in transit</li>
            <li>AES-256 encryption at rest (Supabase)</li>
            <li>Row-Level Security (RLS) database policies</li>
            <li>Biometric authentication on native apps</li>
            <li>Encrypted credential storage on device</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">8. Children&apos;s Privacy</h2>
          <p>OverBerg Go is not intended for use by persons under 18. We do not knowingly collect personal information from children.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">9. Changes to This Policy</h2>
          <p>We may update this policy from time to time. Material changes will be communicated via the app or email. Continued use after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-t1 mb-2">10. Contact</h2>
          <p>Information Officer: Eugene Heferon</p>
          <p>Email: privacy@overberggo.co.za</p>
          <p>Address: Hermanus, Western Cape, South Africa</p>
        </section>
      </div>
    </div>
  );
}
