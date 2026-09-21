import { useTasks } from '../context/TasksContext';

interface BarProps {
  label: string;
  value: number;
  total: number;
  colorVar: string;
}

function Bar({ label, value, total, colorVar }: BarProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${pct}%`, background: `var(${colorVar})` }}
        />
      </div>
      <div className="bar-value">
        {value} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({pct}%)</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { tasks, counts } = useTasks();
  const total = tasks.length;
  const completionPct = total > 0 ? Math.round((counts.done / total) * 100) : 0;

  return (
    <>
      <header id="analytics-page-head" className="page-head">
        <div>
          <h1>Analytics</h1>
          <div className="sub">A quick read on how your board and tasks are trending.</div>
        </div>
      </header>

      {total === 0 ? (
        <div className="empty-col">Create a few tasks and your stats will show up here.</div>
      ) : (
        <div id="analytics-grid" className="analytics-grid">
          <div className="analytics-card completion-card">
            <div
              className="completion-ring"
              style={{ ['--pct' as any]: completionPct }}
            >
              <div className="completion-pct">{completionPct}%</div>
            </div>
            <div>
              <div className="analytics-card-title">Completion rate</div>
              <div className="analytics-card-sub">
                {counts.done} of {total} tasks done
              </div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-title">By status</div>
            <Bar label="To do" value={counts.todo} total={total} colorVar="--ink-200" />
            <Bar label="In progress" value={counts.inProgress} total={total} colorVar="--amber" />
            <Bar label="Done" value={counts.done} total={total} colorVar="--teal" />
          </div>

          <div className="analytics-card">
            <div className="analytics-card-title">By priority</div>
            <Bar label="High" value={counts.high} total={total} colorVar="--coral" />
            <Bar label="Medium" value={counts.medium} total={total} colorVar="--amber" />
            <Bar label="Low" value={counts.low} total={total} colorVar="--ink-400" />
          </div>

          <div className="analytics-card overdue-card">
            <div className="analytics-card-title">Overdue</div>
            <div className={`overdue-num${counts.overdue > 0 ? ' has-overdue' : ''}`}>
              {counts.overdue}
            </div>
            <div className="analytics-card-sub">
              {counts.overdue > 0
                ? `${counts.overdue} task${counts.overdue > 1 ? 's' : ''} past due date`
                : "You're all caught up! No overdue tasks."}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
