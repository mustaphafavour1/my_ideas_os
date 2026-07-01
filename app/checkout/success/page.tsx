export const metadata = {
  title: 'Payment successful — Idea OS',
};

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6">
          <span className="font-display text-2xl text-[#F0F0F5]">Idea OS</span>
        </div>

        <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] p-8">
          <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#4ADE80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[#F0F0F5] font-semibold text-lg mb-2">Payment successful</p>
          <p className="text-sm text-[#9090A8] leading-relaxed">
            Check your email for a sign-in link — click it to open your dashboard. Your plan is already active, no further setup needed.
          </p>
        </div>

        <p className="mt-4 text-xs text-[#4A4A5A]">
          Didn&apos;t get it? Check spam, or{' '}
          <a href="/login" className="text-[#9090A8] hover:text-[#F0F0F5] transition-colors">
            request a new link
          </a>
          .
        </p>
      </div>
    </div>
  );
}
