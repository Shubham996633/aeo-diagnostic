import { notFound } from "next/navigation";
import { getReport } from "@/lib/api";
import ScoreHero from "@/components/ScoreHero";
import EngineBreakdown from "@/components/EngineBreakdown";
import ShareOfVoice from "@/components/ShareOfVoice";
import Recommendations from "@/components/Recommendations";
import QuestionsList from "@/components/QuestionsList";
import DeleteReportButton from "@/components/DeleteReportButton";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let report;
  try {
    report = await getReport(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <a
          href="/dashboard"
          className="inline-flex items-center text-sm text-ink-600 hover:text-ink-900"
        >
          ← Back to dashboard
        </a>
        <DeleteReportButton reportId={report.id} />
      </div>

      <ScoreHero score={report.aeo_score} brand={report.brand} category={report.category} />

      <div className="grid gap-6 md:grid-cols-2">
        <EngineBreakdown scores={report.engine_scores} />
        <ShareOfVoice shares={report.share_of_voice} targetBrand={report.brand} />
      </div>

      <Recommendations recommendations={report.recommendations} />

      <QuestionsList
        results={report.results}
        losingQuestions={report.losing_questions}
        targetBrand={report.brand}
      />

      <p className="pt-4 text-center text-xs text-ink-400">
        Report {report.id} · {new Date(report.created_at).toLocaleString()}
      </p>
    </div>
  );
}
