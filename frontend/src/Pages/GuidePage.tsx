import { useNavigate } from "react-router-dom";

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-4">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
        {n}
      </span>
      <div className="flex flex-col gap-2 pt-1 min-w-0">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <div className="text-sm text-gray-300 flex flex-col gap-2 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-5">
      {children}
    </div>
  );
}

function Note({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: React.ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "bg-amber-950 border-amber-700 text-amber-200"
      : "bg-blue-950 border-blue-800 text-blue-200";
  return (
    <div
      className={`px-3 py-2 border rounded-lg text-xs leading-relaxed ${styles}`}
    >
      {children}
    </div>
  );
}

function UI({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-100 text-xs font-medium whitespace-nowrap">
      {children}
    </span>
  );
}

const CONSTRAINTS: { label: string; description: string }[] = [
  {
    label: "Earliest start",
    description: "No lessons before a given time.",
  },
  {
    label: "Latest end",
    description: "No lessons after a given time.",
  },
  {
    label: "Free days",
    description: "Ask for a minimum number of completely lesson-free days.",
  },
  {
    label: "Specific free days",
    description: "Keep chosen days (e.g. Friday) completely free.",
  },
  {
    label: "Blocked slot",
    description: "Block a recurring window.",
  },
  {
    label: "Lunch break",
    description:
      "Reserve an unbroken break of 30/60/90/120 minutes inside a window you pick.",
  },
  {
    label: "Max consecutive",
    description: "Limit how many back-to-back lesson hours you can be given.",
  },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: '"No valid timetable found"',
    a: (
      <>
        Your <strong>hard</strong> constraints contradict each other or the
        available classes. Switch the least important ones to soft (click the
        red <UI>hard</UI> label), or remove one and optimise again.
      </>
    ),
  },
  {
    q: "The optimiser didn't change anything",
    a: (
      <>
        Every lesson type may be locked, skipped, or already optimal. Unlock a
        few lessons and try again.
      </>
    ),
  },
  {
    q: "I can't find my module",
    a: (
      <>
        Search by code (<UI>CS2040S</UI>) rather than by name, and type at least
        two characters. Module data comes live from NUSMods, so modules not
        offered this semester won't have timetable slots.
      </>
    ),
  },
  {
    q: "Will I lose my timetable?",
    a: (
      <>
        As a guest it lives in this browser only — clearing site data or
        switching devices loses it. Logged in, it's saved to your account
        automatically a second after every change.
      </>
    ),
  },
  {
    q: "Forgot your password?",
    a: (
      <>
        Use <UI>Forgot your password?</UI> on the login screen for a reset
        email, or change it any time from <UI>Profile</UI> once logged in.
      </>
    ),
  },
];

export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-10">
      {/* Hero */}
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-white">Getting started</h1>
        <p className="text-gray-300 leading-relaxed">
          modMates builds your NUS timetable around the rules you actually care
          about. No 8am starts, Friday off, lunch every day, and then does the
          same thing for your whole friend group at once, so you end up in the
          same tutorials.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void navigate("/optimiser")}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Open the optimiser
          </button>
          <a
            href="#groups"
            className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm font-semibold rounded-lg transition-colors"
          >
            Jump to groups
          </a>
        </div>
      </header>

      {/* Solo walkthrough */}
      <Section
        id="solo"
        title="Your own timetable"
        subtitle="Seven steps, about two minutes."
      >
        <Card>
          <Step n={1} title="Get in">
            <p>
              Sign up with your email, log in, or hit <UI>Continue as guest</UI>{" "}
              to skip straight to the optimiser.
            </p>
            <Note>
              Guests get the full optimiser, saved in this browser only. An
              account adds cross-device saving and groups. You can create one
              later without losing your work.
            </Note>
          </Step>

          <Step n={2} title="Add your modules">
            <p>
              On <UI>Optimiser</UI>, open the <UI>Modules</UI> tab at the bottom
              and search a code such as <UI>CS2040S</UI>. Hover <UI>ⓘ</UI> for
              the description and exam date, then click a result to add it.
              Remove a module with the <UI>x</UI> beside it.
            </p>
          </Step>

          <Step n={3} title="Read the grid">
            <p>
              The timetable runs Monday to Friday, 8am to 8pm, one colour per
              module. Click any class to reveal its <em>alternative</em> slots
              greyed in behind the grid; click one of those to switch to it.
              Click empty space to close.
            </p>
          </Step>

          <Step n={4} title="Lock what's fixed, skip what you won't attend">
            <p>
              Each lesson type in the <UI>Modules</UI> tab has two toggles:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                <strong>Lock</strong> — pin your current class. The optimiser
                will work around it instead of moving you.
              </li>
              <li>
                <strong>Eye</strong> — mark a lesson as not attending (webcast
                lectures, say). It leaves the grid entirely and stops blocking
                other classes.
              </li>
            </ul>
            <Note>
              Marking a lesson as not attending clears its lock — a lesson you
              aren't going to has nothing to pin.
            </Note>
          </Step>

          <Step n={5} title="Add your constraints">
            <p>
              Switch to the <UI>Constraints</UI> tab and press <UI>+ Add</UI>:
            </p>
            <ul className="flex flex-col gap-1.5">
              {CONSTRAINTS.map((c) => (
                <li key={c.label} className="flex gap-2">
                  <span className="text-white font-medium shrink-0 w-36">
                    {c.label}
                  </span>
                  <span className="text-gray-400">{c.description}</span>
                </li>
              ))}
            </ul>
            <p>
              Every constraint is either <strong>hard</strong> (must be
              satisfied. The optimiser fails rather than break it) or{" "}
              <strong>soft</strong> (a preference it trades off against the
              others). Click the red <UI>hard</UI> / blue <UI>soft</UI> label to
              switch, and drag a soft constraint's priority from Low to High to
              say how much you care.
            </p>
            <Note tone="warn">
              Start with everything soft. Make a rule hard only when you would
              genuinely rather have no timetable than break it.
            </Note>
          </Step>

          <Step n={6} title="Optimise">
            <p>
              Press <UI>Optimise</UI>. modMates searches every legal combination
              of your unlocked classes and returns the best ones, ranked and
              scored as a percentage. Click <UI>#1</UI>, <UI>#2</UI> … to
              preview each in the grid. The one you leave selected is the one
              that's saved.
            </p>
          </Step>

          <Step n={7} title="Export to NUSMods">
            <p>
              <UI>Export to NUSMods</UI> opens your finished timetable as a
              NUSMods share link in a new tab, ready to save there alongside
              everything else.
            </p>
          </Step>
        </Card>
      </Section>

      {/* Groups */}
      <Section
        id="groups"
        title="Optimising with friends"
        subtitle="Requires an account — this is the part guests miss out on."
      >
        <Card>
          <Step n={1} title="Create or join a group">
            <p>
              On <UI>Groups</UI>, name a group and press <UI>Create Group</UI>,
              or paste a friend's invite code and press <UI>Join Group</UI>.
              Every group shows its own invite code. Send that to the people you
              want in it.
            </p>
          </Step>

          <Step n={2} title="Everyone sets up their own timetable first">
            <p>
              The group optimiser works from each member's saved modules, locks,
              skips and constraints. Anyone who hasn't done the solo steps above
              has nothing to optimise.
            </p>
          </Step>

          <Step n={3} title="Optimise for the group">
            <p>
              Open the group and press <UI>Optimise for Group</UI>. modMates
              solves for everyone at once, maximising the classes you share
              while still respecting each person's own constraints. The tabs
              across the top let you view any member's proposed timetable.
            </p>
          </Step>

          <Step n={4} title="Review, then apply">
            <p>
              The preview lists every change as{" "}
              <span className="text-amber-300">old → new</span>. Press{" "}
              <UI>Apply to Group</UI> to write it to everyone's saved timetable,
              or <UI>Discard</UI> to walk away.
            </p>
            <Note tone="warn">
              Applying updates <strong>all</strong> members' timetables, not
              just yours. Everyone's locked and skipped lessons are preserved.
            </Note>
          </Step>

          <Step n={5} title="Check the overlap">
            <p>
              The <UI>Group overlap</UI> panel breaks it down module by module:
              a green <span className="text-green-400">✓</span> next to a name
              means you're in the same class, a grey ✗ means you're not.
            </p>
          </Step>
        </Card>
      </Section>

      {/* Profile */}
      <Section id="profile" title="Your profile">
        <Card>
          <div className="text-sm text-gray-300 flex flex-col gap-2 leading-relaxed">
            <p>
              <UI>Profile</UI> holds your email, your groups, and a{" "}
              <strong>display name</strong> — worth setting, because it's what
              your friends see on the group tabs instead of your email address.
              You can also change your password there.
            </p>
          </div>
        </Card>
      </Section>

      {/* FAQ */}
      <Section id="help" title="When something goes wrong">
        <div className="flex flex-col gap-3">
          {FAQ.map(({ q, a }) => (
            <div
              key={q}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4"
            >
              <p className="text-sm font-semibold text-white">{q}</p>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </Section>

      <footer className="flex flex-col items-start gap-3 border-t border-gray-800 pt-6">
        <p className="text-sm text-gray-400">That's everything. Go build it.</p>
        <button
          type="button"
          onClick={() => void navigate("/optimiser")}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Open the optimiser
        </button>
      </footer>
    </div>
  );
}
