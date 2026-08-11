/**
 * coverage-data.js
 * ------------------------------------------------------------
 * Configurable demo network data for Kings Network Indonesia.
 * Replace these values with real coverage data from the company
 * database / API. Positions are normalized coordinates (0..1)
 * along the stylized Java Island silhouette used by the 3D
 * visualizations — NOT geographic lat/lng, and not a claim of
 * exact service-area boundaries.
 * ------------------------------------------------------------
 */

const KINGS_COVERAGE_DATA = {
  island: {
    name: "Java Island",
    // Normalized silhouette path for the island shape, west (Jakarta) -> east.
    // x: 0 (west) .. 10 (east), y: north(-) .. south(+), rough proportions only.
    outline: [
      [0.0, 0.65], [0.35, 0.35], [0.9, 0.15], [1.6, 0.05],
      [2.4, -0.05], [3.3, 0.05], [4.2, 0.15], [5.1, 0.1],
      [6.0, 0.2], [6.9, 0.15], [7.8, 0.25], [8.6, 0.35],
      [9.4, 0.5], [10.0, 0.7],
      [10.0, 1.35], [9.3, 1.55], [8.5, 1.6], [7.6, 1.5],
      [6.7, 1.6], [5.8, 1.7], [4.9, 1.6], [4.0, 1.65],
      [3.1, 1.55], [2.2, 1.5], [1.3, 1.45], [0.55, 1.2],
      [0.0, 0.95]
    ]
  },

  regions: {
    jakarta: {
      label: "Jakarta",
      sublabel: "Core Network",
      type: "core",
      status: "connected",
      position: [0.35, 0.75],
      services: ["Home Internet", "Business Internet", "Dedicated Internet", "Enterprise Networking"]
    },
    banten: {
      label: "Banten",
      sublabel: "Regional Node",
      type: "regional",
      status: "connected",
      position: [1.3, 0.55],
      services: ["Home Internet", "Business Internet"]
    },
    westJava: {
      label: "West Java",
      sublabel: "Regional Node",
      type: "regional",
      status: "connected",
      position: [3.0, 0.85],
      services: ["Home Internet", "Business Internet", "Dedicated Internet"]
    },
    centralJava: {
      label: "Central Java",
      sublabel: "Regional Node",
      type: "regional",
      status: "planned",
      position: [5.4, 0.85],
      services: ["Business Internet", "Dedicated Internet"]
    },
    yogyakarta: {
      label: "Yogyakarta",
      sublabel: "Regional Node",
      type: "regional",
      status: "planned",
      position: [6.4, 1.05],
      services: ["Home Internet", "Business Internet"]
    },
    eastJava: {
      label: "East Java",
      sublabel: "Regional Node",
      type: "regional",
      status: "coming-soon",
      position: [8.8, 0.85],
      services: ["Business Internet", "Enterprise Networking"]
    }
  },

  // Routes are pairs of region keys. Drawn as animated fiber/data links.
  routes: [
    ["jakarta", "banten"],
    ["jakarta", "westJava"],
    ["westJava", "centralJava"],
    ["centralJava", "yogyakarta"],
    ["centralJava", "eastJava"],
    ["yogyakarta", "eastJava"]
  ],

  // Placeholder panel stats — replace with real figures when available.
  stats: {
    networkNodes: "—",
    fiberRoutesKm: "—",
    primaryHub: "Jakarta"
  },

  statusLabels: {
    connected: "Connected",
    planned: "Planned",
    "coming-soon": "Coming Soon"
  }
};

// Expose for non-module scripts / debugging.
window.KINGS_COVERAGE_DATA = KINGS_COVERAGE_DATA;

export default KINGS_COVERAGE_DATA;
