export default function BlockchainExplorer({ chain, transactions = [], loading = false }) {
  return (
    <div>
      {chain && (
        <div style={metricGrid}>
          {[
            { label: "DEPLOYER", value: `${chain.deployer?.slice(0, 18)}...`, color: "#0EA5E9" },
            { label: "LATEST BLOCK", value: `#${chain.block_number}`, color: "#10B981" },
            { label: "NETWORK", value: chain.network_id === 1337 ? "Ganache Local" : `Chain ${chain.network_id}`, color: "#F59E0B" },
            { label: "CHAIN ID", value: chain.network_id, color: "#10B981" },
          ].map((item) => (
            <div key={item.label} style={metricCard}>
              <div style={metricLabel}>{item.label}</div>
              <div style={{ ...metricValue, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={label}>RECENT TRANSACTIONS</div>
      {loading ? (
        <div style={empty}>Loading chain data...</div>
      ) : transactions.length === 0 ? (
        <div style={empty}>No transactions yet. Lock an exam first.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {transactions.map((tx, i) => (
            <div key={`${tx.tx_hash}-${i}`} style={txCard}>
              <div style={txTop}>
                <div style={txHash}>{tx.tx_hash?.slice(0, 24)}...</div>
                <div style={txMeta}>Block #{tx.block}</div>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={txMeta}>FROM: <span style={txValue}>{tx.from?.slice(0, 14)}...</span></div>
                <div style={txMeta}>GAS: <span style={txValue}>{tx.gas_used?.toLocaleString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const metricGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "2rem" };
const metricCard = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1rem 1.2rem" };
const metricLabel = { fontFamily: "monospace", fontSize: 9.5, color: "#334155", letterSpacing: 2, marginBottom: 6 };
const metricValue = { fontFamily: "monospace", fontWeight: 700, fontSize: 13 };
const label = { fontFamily: "monospace", fontSize: 10, color: "#334155", letterSpacing: 2, marginBottom: 12 };
const empty = { color: "#475569", fontFamily: "monospace", fontSize: 13 };
const txCard = { background: "#0D1117", border: "1px solid #1E293B", borderRadius: 8, padding: "1rem 1.25rem" };
const txTop = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 };
const txHash = { fontFamily: "monospace", fontSize: 11, color: "#0EA5E9" };
const txMeta = { fontFamily: "monospace", fontSize: 10, color: "#475569" };
const txValue = { color: "#64748B" };
