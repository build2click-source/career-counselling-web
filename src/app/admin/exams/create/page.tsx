"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function CreateExam() {
    const router = useRouter();
    const { data: session } = useSession();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);

    // To keep it simple for the demo, we'll build a fixed structure that the teacher modifies.
    // In a robust app, you'd use a complex nested form builder.
    const [sections, setSections] = useState([
        {
            title: "Reading Section 1",
            questionGroups: [
                {
                    type: "Multiple Choice",
                    context: "Write a passage or instructions here...",
                    audioUrl: "",
                    imageUrl: "",
                    questions: [
                        { text: "Sample Question 1?", options: '["A", "B", "C"]', correctAnswer: "A", marks: 1, audioUrl: "", imageUrl: "" }
                    ]
                }
            ]
        }
    ]);

    const [saving, setSaving] = useState(false);

    // Allow basic JSON updates
    const handleJSONUpdate = (newJson: string) => {
        try {
            const parsed = JSON.parse(newJson);
            setSections(parsed);
        } catch (e) {
            // ignore parse errors while typing
        }
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                title,
                description,
                timeLimitMinutes: Number(timeLimitMinutes),
                sections: sections.map((s, i) => ({
                    ...s,
                    order: i + 1,
                    questionGroups: s.questionGroups.map(g => ({
                        ...g,
                        questions: g.questions.map(q => ({
                            ...q,
                            marks: Number(q.marks),
                            // Ensure options remains as a serialized JSON string array on submission if it was parsed differently
                            options: q.options
                        }))
                    }))
                }))
            };

            const res = await fetch('/api/admin/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Exam created successfully!");
                router.push('/admin');
            } else {
                alert("Failed to create exam.");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving the exam.");
        } finally {
            setSaving(false);
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return <div className="container" style={{ padding: '4rem 0' }}>Unauthorized Access</div>;
    }

    return (
        <div className="container" style={{ padding: '3rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: 0 }}>Create New Exam</h1>
                <Link href="/admin" className="btn btn-secondary">Cancel</Link>
            </div>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Basic Information</h2>

                <div className="input-group">
                    <label className="input-label">Exam Title</label>
                    <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Weekly IELTS Mock 4" />
                </div>

                <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Provide overview instructions..."></textarea>
                </div>

                <div className="input-group">
                    <label className="input-label">Time Limit (Minutes)</label>
                    <input type="number" className="input-field" value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(parseInt(e.target.value))} required />
                </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Structure Editor (JSON)</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                    For advanced teachers. Edit the deeply nested JSON array directly to structure the exact sections, question groups, text/audio/img URLs, and answers.
                    Make sure options string is a valid serialized array like `["Option 1", "Option 2"]`.
                </p>

                <textarea
                    className="input-field"
                    rows={20}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                    value={JSON.stringify(sections, null, 2)}
                    onChange={e => handleJSONUpdate(e.target.value)}
                />
            </div>

            <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={saving}>
                {saving ? 'Saving Exam...' : 'Publish Exam'}
            </button>

        </div>
    );
}
