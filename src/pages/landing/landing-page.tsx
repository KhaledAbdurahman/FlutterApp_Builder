import { Link } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { Button, Container, Group, Text, Title } from '@mantine/core';
import {
  ArrowRight,
  Bot,
  Box,
  Code2,
  Download,
  Github,
  Layers,
  Palette,
  Play,
  Sparkles,
  Workflow,
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserProfileMenu } from '@/components/UserProfileMenu';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/pages/landing/landing-page.module.css';

const BuilderSteps = [
  {
    number: '01',
    title: 'Shape the first screens',
    text: 'Drag supported Flutter widgets into a real screen flow.',
  },
  {
    number: '02',
    title: 'Use AI for the visual direction',
    text: 'Get help with the interface, not a black-box project manager.',
  },
  {
    number: '03',
    title: 'Export a project developers recognise',
    text: 'Hand the team a neat Flutter project they can extend with confidence.',
  },
];

const HERO_TITLE = 'Build the product story before you build the whole product.';

const HeroWordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({ opacity: 1, y: 0, transition: { delay: index * 0.045 } }),
};

const LandingPage = () => {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Container size="lg" className={styles.headerContent}>
          <Link to="/" aria-label="AppBuilder home">
            <BrandLogo />
          </Link>
          <Group gap="xs">
            <ThemeToggle />
            {user ? (
              <UserProfileMenu />
            ) : (
              <>
                <Button component={Link} to="/auth" variant="subtle" color="gray">
                  Sign in
                </Button>
                <Button component={Link} to="/auth" search={{ mode: 'register' }}>
                  Get started
                </Button>
              </>
            )}
          </Group>
        </Container>
      </header>

      <main>
        <section className={styles.hero}>
          <Container size="lg" className={styles.heroGrid}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.heroContent}
            >
              <Text className={styles.eyebrow}>
                <Sparkles size={14} /> Flutter MVPs, without the prompt marathon
              </Text>
              <motion.h1
                className={styles.heroTitle}
                initial="hidden"
                animate="visible"
                aria-label={HERO_TITLE}
              >
                {HERO_TITLE.split(' ').map((word, index) => (
                  <motion.span
                    key={`${word}-${index}`}
                    custom={index}
                    variants={HeroWordVariants}
                    animate={prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
              <Text className={styles.heroCopy}>
                AI can accelerate developers, but it does not give everyday founders a dependable
                route to a working MVP. AppBuilder turns one focused session into a Flutter app your
                team can continue to own.
              </Text>
              <Group gap="sm" className={styles.heroActions}>
                <Button
                  component={Link}
                  to="/auth"
                  search={{ mode: 'register' }}
                  size="md"
                  rightSection={<ArrowRight size={18} />}
                >
                  Build an MVP
                </Button>
                <Button
                  component="a"
                  href="https://github.com/NabilDev0/FlutterApp_Builder_Project"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="md"
                  variant="default"
                  leftSection={<Github size={18} />}
                >
                  See the project
                </Button>
              </Group>
              <Text className={styles.heroNote}>
                Start with the interface. Keep control of the codebase.
              </Text>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 22 }}
              animate={
                prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0, y: [0, -5, 0] }
              }
              transition={
                prefersReducedMotion
                  ? { delay: 0.12 }
                  : { delay: 0.12, y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } }
              }
              className={styles.productPreview}
            >
              <div className={styles.previewBar}>
                <span>AppBuilder workspace</span>
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className={styles.previewWorkspace}>
                <div className={styles.previewSidebar}>
                  <Text>WIDGETS</Text>
                  {['Container', 'Text', 'Button', 'Image'].map((widget) => (
                    <div key={widget}>{widget}</div>
                  ))}
                </div>
                <div className={styles.previewCanvas}>
                  <div className={styles.phone}>
                    <div className={styles.phoneNotch} />
                    <div className={styles.phoneScreen}>
                      <span>Welcome back</span>
                      <small>Your next idea, ready to build.</small>
                      <button type="button">Get started</button>
                      <div className={styles.phoneTabs}>
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.previewProperties}>
                  <Text>PROPERTIES</Text>
                  <label>
                    Title
                    <input value="Welcome back" readOnly />
                  </label>
                  <label>
                    Color
                    <span className={styles.colorSwatch} />
                  </label>
                  <label>
                    Padding
                    <input value="24" readOnly />
                  </label>
                </div>
              </div>
              <div className={styles.previewFooter}>
                <span>
                  <Play size={14} /> Live preview ready
                </span>
                <span>main.dart</span>
              </div>
            </motion.div>
          </Container>
        </section>

        <section className={styles.proof}>
          <Container size="lg">
            <Text>
              Made for founders who need momentum and engineering teams who need a clean handoff.
            </Text>
          </Container>
        </section>

        <section className={styles.path}>
          <Container size="lg">
            <div className={styles.sectionHeading}>
              <Text className={styles.eyebrow}>One focused session</Text>
              <Title order={2}>
                From rough idea to a Flutter project worth opening in an editor.
              </Title>
            </div>
            <div className={styles.steps}>
              {BuilderSteps.map((step) => (
                <article key={step.number} className={styles.step}>
                  <Text>{step.number}</Text>
                  <Title order={3}>{step.title}</Title>
                  <Text>{step.text}</Text>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className={styles.bentoSection}>
          <Container size="lg">
            <div className={styles.sectionHeading}>
              <Text className={styles.eyebrow}>Intentional assistance</Text>
              <Title order={2}>
                AI is a design collaborator, not your replacement engineering department.
              </Title>
            </div>
            <div className={styles.bentoGrid}>
              <article className={`${styles.bentoCard} ${styles.aiCard}`} tabIndex={0}>
                <Bot size={28} />
                <Title order={3}>Ask AI for UI direction</Title>
                <Text>
                  Explore visual treatments and interface choices while the decisions remain visible
                  and editable in the builder.
                </Text>
                <div className={styles.chatLines}>
                  <span>“Make this onboarding screen clearer.”</span>
                  <span>Suggested: reduce choices and lead with one action.</span>
                </div>
              </article>
              <article className={`${styles.bentoCard} ${styles.dragCard}`} tabIndex={0}>
                <Layers size={28} />
                <Title order={3}>Build by arranging, not prompting</Title>
                <Text>
                  Use the drag-and-drop canvas to create the screens that make an MVP
                  understandable.
                </Text>
                <div className={styles.dragStack}>
                  <span>
                    <Box size={15} /> Header
                  </span>
                  <span>
                    <Box size={15} /> Content
                  </span>
                  <span>
                    <Box size={15} /> Primary action
                  </span>
                </div>
              </article>
              <article className={`${styles.bentoCard} ${styles.codeCard}`} tabIndex={0}>
                <Code2 size={28} />
                <Title order={3}>Export without leaving a mess behind</Title>
                <Text>
                  Choose the structure that fits the software engineering needs of the team that
                  inherits the work.
                </Text>
                <pre>lib/ features/ shared/ main.dart</pre>
              </article>
            </div>
          </Container>
        </section>

        <section className={styles.developerSection}>
          <Container size="lg" className={styles.developerGrid}>
            <div>
              <Text className={styles.eyebrow}>A better handoff</Text>
              <Title order={2}>
                Your developers should thank you, not spend a week untangling the first prototype.
              </Title>
              <Text>
                AppBuilder exports developer-friendly Flutter projects with a deliberate structure.
                The team can choose the architecture that matches its conventions, then carry the
                MVP forward instead of rewriting it from scratch.
              </Text>
            </div>
            <div className={styles.architectureList}>
              <div>
                <Workflow size={20} />
                <span>
                  <strong>Flexible architecture</strong>Choose a project shape that fits the team.
                </span>
              </div>
              <div>
                <Palette size={20} />
                <span>
                  <strong>Visible UI decisions</strong>Every screen begins as something the team can
                  inspect.
                </span>
              </div>
              <div>
                <Download size={20} />
                <span>
                  <strong>Clean export</strong>Download a working Flutter project when the MVP is
                  ready.
                </span>
              </div>
            </div>
          </Container>
        </section>

        <section className={styles.callout}>
          <Container size="lg" className={styles.calloutContent}>
            <div>
              <Text className={styles.eyebrow}>Make the first session count</Text>
              <Title order={2}>Turn a useful idea into a Flutter MVP today.</Title>
              <Text>
                Build the interface, review it on a device frame, then give developers a project
                they can respect.
              </Text>
            </div>
            <Button
              component={Link}
              to="/auth"
              search={{ mode: 'register' }}
              size="md"
              rightSection={<ArrowRight size={18} />}
            >
              Create an account
            </Button>
          </Container>
        </section>
      </main>

      <footer className={styles.footer}>
        <Container size="lg" className={styles.footerContent}>
          <BrandLogo />
          <Text size="sm" c="dimmed">
            Copyright 2026 AppBuilder
          </Text>
          <a
            href="https://github.com/NabilDev0/FlutterApp_Builder_Project"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="AppBuilder on GitHub"
          >
            <Github size={20} />
          </a>
        </Container>
      </footer>
    </div>
  );
};

export { LandingPage };
