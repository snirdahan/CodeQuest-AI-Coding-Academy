import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LessonClient } from "@/components/lesson-client";
import { Blocks, RichText } from "@/components/rich-text";
import { Badge, Card } from "@/components/ui";
import { getCourse, getLesson } from "@/content/catalog";
import { publicExercise } from "@/lib/lesson-service";
import { lessonAccess, progressMap } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const progress = progressMap(user.id);
  const access = lessonAccess(user, lesson, progress);
  if (access === "locked-premium") redirect("/pricing");
  if (access === "locked-order") redirect(`/course/${lesson.courseId}`);
  const course = getCourse(lesson.courseId)!;
  const index = course.lessons.findIndex((l) => l.id === lesson.id);
  const p = progress.get(lesson.id);

  return (
    <AppShell user={user} active="/learn">
      <div className="mx-auto max-w-4xl animate-fade-up space-y-8">
        <div>
          <Link href={`/course/${course.id}`} className="text-sm text-slate-400 hover:text-white">→ {course.title} · שיעור {index + 1} מתוך {course.lessons.length}</Link>
          <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="blue">⏱ כ־{lesson.minutes} דקות</Badge>
            <Badge tone="violet"><span dir="ltr">+{lesson.xp} XP</span></Badge>
            {p?.challenge_done ? <Badge tone="green">✓ הושלם</Badge> : null}
          </div>
        </div>

        <Card className="border-electric/25 bg-electric/5">
          <div className="text-sm font-semibold text-blue-300">🎯 מטרת השיעור</div>
          <p className="mt-1 text-slate-200"><RichText text={lesson.objective} /></p>
        </Card>

        <section>
          <h2 className="mb-4 text-xl font-bold">📖 הסבר</h2>
          <Blocks blocks={lesson.explanation} />
        </section>

        <LessonClient
          exercise={publicExercise(user, lesson)}
          quiz={{ question: lesson.quiz.question, code: lesson.quiz.code, options: lesson.quiz.options.map((o) => o.text) }}
          quizDone={!!p?.quiz_done}
          hintsUsed={p?.hints_used ?? 0}
          instructions={<Blocks blocks={lesson.challenge.instructions} />}
        />
      </div>
    </AppShell>
  );
}
