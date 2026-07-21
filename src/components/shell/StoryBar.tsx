import { useDemo, type StoryStep } from "../../state/DemoStore";

const STEPS: { step: StoryStep; label: string }[] = [
  { step: 1, label: "提出" },
  { step: 2, label: "最適案" },
  { step: 3, label: "確定通知" },
  { step: 4, label: "確認" },
];

export function StoryBar() {
  const { story } = useDemo();
  const { current, done, hint, nextAction } = story;

  return (
    <div className="storyBar" aria-label="デモの流れ">
      <ol className="storySteps">
        {STEPS.map(({ step, label }, i) => {
          const isDone = done[step];
          const isCurrent = current === step && !(step === 4 && isDone);
          return (
            <li key={step} className="storyStepItem">
              {i > 0 ? <span className="storyArrow" aria-hidden>→</span> : null}
              <span
                className={`storyStep${isDone ? " isDone" : ""}${isCurrent ? " isCurrent" : ""}`}
              >
                <span className="storyNum tnum">{step}</span>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="storyMeta">
        <p className="storyHint">{hint}</p>
        {nextAction ? (
          <button
            type="button"
            className="storyCta"
            onClick={nextAction.run}
          >
            {nextAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
