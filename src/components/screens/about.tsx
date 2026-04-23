import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import type { Screen } from "@/pages/Index";

interface AboutScreenProps {
  onNavigate: (screen: Screen) => void;
}

const AboutScreen = ({ onNavigate }: AboutScreenProps) => {
  const donationLink = "https://www.up.edu/alumni/donate/index.html";
  const givingEmail = "giving@up.edu";
  const sponsorshipEmail = "giving@up.edu?subject=Campus%20History%20Archive%20Sponsorship";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-purple text-primary-foreground px-5 py-6">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>
        <h1 className="text-3xl font-bold">About</h1>
      </div>

      <div className="px-5 py-8 max-w-lg mx-auto space-y-8">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-2xl font-bold text-foreground mb-3">The Project</h2>
          <p className="text-foreground/80 leading-relaxed">
            The Campus History Web Application is an interactive tool designed to showcase the rich history of the
            University of Portland. Developed as part of the university's 125th-anniversary celebration, this app
            offers access to historical images, facts, and stories about key campus locations.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-foreground mb-3">Credits</h2>
          <div className="space-y-3">
            <p className="text-foreground/80">Thank you to the Marketing Team for helping make this possible.</p>
            <p className="text-foreground/80">Thank you to the Archives for providing images and information.</p>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-bold text-foreground mb-3">Resources</h2>
          <div className="space-y-2">
            <a
              href="https://digital.up.edu/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary font-medium hover:underline"
            >
              Clark Library Digital Collections <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://sites.up.edu/museum/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary font-medium hover:underline"
            >
              University Museum <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-2xl font-bold text-foreground mb-3">Support The Archive</h2>
          <div className="glass-card rounded-xl p-5 space-y-3">
            <p className="text-sm text-foreground/80">
              Alumni gifts and campus or local sponsorships can help fund archive uploads, quest upkeep, and long-term hosting for this project.
            </p>
            <div className="grid gap-3">
              <div className="rounded-lg border border-border bg-card px-3 py-3">
                <p className="text-sm font-semibold text-foreground">Alumni Donations</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  One-time or recurring gifts can support new content, preserve digital history, and keep the archive accessible to future Pilots.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <a
                    href={donationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Donate To The Archive <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={`mailto:${givingEmail}?subject=Campus%20History%20Archive%20Donation`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    Email About Giving <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-3">
                <p className="text-sm font-semibold text-foreground">Campus And Local Sponsors</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Departments, alumni businesses, and Portland partners can sponsor campus quest rewards, archive features, or event activations tied to the site.
                </p>
                <a
                  href={`mailto:${sponsorshipEmail}`}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
                >
                  Become A Sponsor <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
              Donations route through the official University of Portland giving page. Sponsorship inquiries open an email draft to the UP giving contact.
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="glass-card rounded-xl p-5 text-center">
            <p className="text-foreground/70 text-sm italic">
              Thank you for trying our Time Machine made by UP Shiley students! 🎓
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AboutScreen;
