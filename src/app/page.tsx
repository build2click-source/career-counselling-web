import Link from "next/link";

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: '4rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
        <h1 style={{ fontSize: '3.5rem', lineHeight: '1.2', marginBottom: '1.5rem', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Master the IELTS with Real-Time Evaluation
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2.5rem' }}>
          Experience an authentic IELTS test environment, complete with timing, mixed question types, and instant automated grading for Reading and Listening sections.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Start for Free
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Login to Account
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '5rem' }}>
        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
          <h3>Realistic Test Simulation</h3>
          <p>Practice under actual exam conditions with strict timers and standard sectional break-downs just like the real IELTS test.</p>
        </div>

        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
          <h3>Instant Automated Grading</h3>
          <p>No more waiting. Get your reading and listening answers evaluated instantly as soon as you submit your test.</p>
        </div>

        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <h3>Detailed Analytics</h3>
          <p>Review every single question from your past attempts, see exactly where you went wrong, and track your progress over time.</p>
        </div>
      </div>
    </div>
  );
}
