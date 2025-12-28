import Card from "../components/Card";

export default function IntroView(props: { onStart: () => void }) {
  return (
    <div className="stack">
      <Card title="What this tool does">
        <p>
          The <strong>Scenario Stress-Test</strong> helps teams explore how a current AI capability profile may
          hold up under plausible change scenarios using the CloudPedagogy AI Capability Framework.
        </p>
        <ul>
          <li><strong>Exploratory</strong>, not predictive</li>
          <li><strong>Signals, not flags</strong> — supports discussion and judgement</li>
          <li><strong>Capability-led</strong> (framework language, not vendor tools)</li>
          <li>Runs entirely in your browser (no accounts, no data upload)</li>
        </ul>
      </Card>

      <Card title="What it is not">
        <ul>
          <li>Not a prediction engine or risk scoring system</li>
          <li>Not a compliance audit, benchmark, or maturity ranking</li>
          <li>Not a policy recommender or automated decision system</li>
        </ul>
      </Card>

      <Card title="How to use this in a workshop">
        <ul>
          <li>Select one scenario that feels plausible or strategically relevant.</li>
          <li>Agree baseline scores through discussion (don’t average individual views).</li>
          <li>Use the signals to ask: <em>what would break first</em>, <em>what is assumed</em>, and <em>what stabilisers are needed</em>.</li>
        </ul>

        <div className="actions">
          <button className="btn btn--primary" onClick={props.onStart}>
            Start stress-test
          </button>
        </div>
      </Card>

      <div className="fineprint muted">
        This tool is capability-led and reflective. It supports exploration and discussion — it is not a prediction engine,
        compliance audit, benchmarking instrument, risk register, or automated decision system.
      </div>
    </div>
  );
}
