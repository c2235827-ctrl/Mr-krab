import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Bell, MapPin, CreditCard, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Eye,
      title: 'What We Collect',
      color: 'text-blue-500 bg-blue-50',
      content: [
        'Your name and email address when you create an account.',
        'Delivery addresses you save for faster ordering.',
        'Your order history so you can reorder your favourites.',
        'Payment confirmation references from Flutterwave — we never store your card details directly.',
        'Device information to keep your account secure.',
      ],
    },
    {
      icon: Lock,
      title: 'How We Use Your Data',
      color: 'text-primary bg-primary/10',
      content: [
        'To process and deliver your orders accurately.',
        'To send you order status updates (confirmed, preparing, delivered).',
        'To send you promotional offers and announcements — you can opt out anytime.',
        'To improve the app experience based on how people use it.',
        'To resolve disputes or support issues you raise with us.',
      ],
    },
    {
      icon: Shield,
      title: 'How We Protect You',
      color: 'text-green-600 bg-green-50',
      content: [
        'All data is stored securely on protected cloud infrastructure with encryption at rest.',
        'Passwords are hashed and never stored in plain text.',
        'All connections between the app and our servers use HTTPS encryption.',
        'Payments are handled entirely by Flutterwave — a PCI-DSS compliant processor. We never touch your card.',
        'Only authorised restaurant staff can see your order details, not your personal account data.',
      ],
    },
    {
      icon: Bell,
      title: 'Notifications',
      color: 'text-accent bg-accent/10',
      content: [
        'We send in-app notifications for order updates automatically.',
        'Promotional notifications are sent when we create new offers.',
        'You can disable marketing notifications in Profile → Privacy & Security.',
        'We do not send spam. Every notification is relevant to your account.',
      ],
    },
    {
      icon: MapPin,
      title: 'Location Data',
      color: 'text-orange-500 bg-orange-50',
      content: [
        'We only use the delivery addresses you manually enter — we do not track your live GPS location.',
        'Addresses are stored to save you time on future orders.',
        'You can delete any saved address from your profile at any time.',
      ],
    },
    {
      icon: CreditCard,
      title: 'Payments',
      color: 'text-purple-500 bg-purple-50',
      content: [
        'All payments are processed securely by Flutterwave.',
        'We receive a payment confirmation reference — never your raw card or bank details.',
        'Cash on Delivery orders are handled entirely in person.',
        'Your wallet balance (if any) is stored securely and can only be used by you.',
      ],
    },
    {
      icon: Trash2,
      title: 'Your Rights',
      color: 'text-red-500 bg-red-50',
      content: [
        'You can request deletion of your account and all associated data at any time.',
        'You can edit your personal information from your profile page.',
        'You can delete saved addresses whenever you want.',
        'You can opt out of marketing notifications without losing account access.',
        'To request full account deletion, contact us directly.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col mb-20">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <button onClick={() => navigate('/profile/security')} className="p-3 bg-white rounded-2xl shadow-sm">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black italic">Privacy & Trust</h1>
          <p className="text-xs text-muted font-bold uppercase tracking-widest">Last updated: April 2026</p>
        </div>
      </div>

      <div className="px-6 flex flex-col gap-6">

        {/* Hero Trust Banner */}
        <div className="bg-primary text-white p-7 rounded-[40px] shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/10 rounded-full" />
          <div className="relative z-10 flex flex-col gap-3">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
              <Shield size={24} className="text-accent" />
            </div>
            <h2 className="text-2xl font-serif font-black italic leading-tight">
              Your trust is our most important ingredient.
            </h2>
            <p className="text-sm opacity-80 leading-relaxed">
              At Mr. Krab, we handle your personal information with the same care 
              we put into every meal. Simple, honest, and always in your best interest.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '🔒', label: 'Encrypted\nData' },
            { emoji: '💳', label: 'Secure\nPayments' },
            { emoji: '🚫', label: 'No Data\nSelling' },
          ].map((badge) => (
            <div key={badge.label} className="bg-white rounded-[24px] p-4 shadow-sm flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">{badge.emoji}</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-muted leading-tight whitespace-pre-line">
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* Promise Statement */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border-l-4 border-accent">
          <p className="text-sm font-bold text-primary leading-relaxed">
            "We will never sell, rent, or share your personal data with 
            third-party advertisers. Your information exists only to help us 
            serve you better."
          </p>
          <p className="text-xs text-muted font-bold mt-2">— Mr. Krab Team</p>
        </div>

        {/* Policy Sections */}
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-[32px] p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                  <section.icon size={20} />
                </div>
                <h3 className="font-black text-base">{section.title}</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {section.content.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                    <span className="text-accent font-black mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Third Party Services */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
          <h3 className="font-black text-base">Third-Party Services We Use</h3>
          <div className="flex flex-col gap-3">
            {[
              { name: 'Cloud Infrastructure', role: 'Database & Authentication', icon: '🗄️' },
              { name: 'Flutterwave', role: 'Payment Processing', icon: '💳' },
              { name: 'ntfy.sh', role: 'Staff Push Notifications (not customer data)', icon: '🔔' },
            ].map((service) => (
              <div key={service.name} className="flex items-center gap-3 p-3 bg-card rounded-2xl">
                <span className="text-2xl">{service.icon}</span>
                <div>
                  <p className="font-bold text-sm">{service.name}</p>
                  <p className="text-xs text-muted">{service.role}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Each of these services has their own privacy policy. We only share 
            the minimum data required for them to perform their function.
          </p>
        </div>

        {/* Data Retention */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-3">
          <h3 className="font-black text-base">How Long We Keep Your Data</h3>
          <p className="text-sm text-muted leading-relaxed">
            Your account data is kept as long as your account is active. Order history 
            is kept for 12 months for support and reference purposes. If you delete 
            your account, all personal data is removed within 30 days.
          </p>
        </div>

        {/* Children Policy */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-3">
          <h3 className="font-black text-base">Age Policy</h3>
          <p className="text-sm text-muted leading-relaxed">
            Mr. Krab is intended for users aged 13 and above. We do not knowingly 
            collect data from children under 13. If you believe a child has registered, 
            please contact us immediately.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-primary text-white p-6 rounded-[32px] shadow-xl flex flex-col gap-4">
          <h3 className="font-black text-lg">Questions or Concerns?</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            If you have any questions about this policy or want to exercise 
            your data rights, reach out to us directly.
          </p>
          <div className="flex flex-col gap-3">
            <a href="mailto:mrkrab@ozsaip.com" className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-colors">
              <Mail size={18} className="text-accent shrink-0" />
              <span className="text-sm font-bold">mrkrab@ozsaip.com</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-40">
            Mr. Krab · Privacy Policy · April 2026
          </p>
          <p className="text-[10px] text-muted opacity-30 mt-1">
            This policy may be updated periodically. Continued use of the app 
            means you accept any changes.
          </p>
        </div>

      </div>
    </div>
  );
}
