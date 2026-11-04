/**
 * Chart colours. The categorical order was validated for colour-vision-deficiency separation
 * (adjacent pairs) in both modes. Light mode has three slots under 3:1 contrast on the surface,
 * so charts always show visible labels and offer a table view.
 */
export const CATEGORICAL = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"],
};

export const OTHER_COLOR = { light: "#898781", dark: "#898781" };

/** Sequential blue ramp for the heatmap: level 0 (empty) to 4 (busiest). */
export const HEAT = {
  light: ["#ebedf0", "#b7d3f6", "#6da7ec", "#2a78d6", "#184f95"],
  dark: ["#2c2c2a", "#184f95", "#256abf", "#3987e5", "#9ec5f4"],
};

export const CHART_INK = {
  light: { text: "#52514e", muted: "#898781", grid: "#e1e0d9", surface: "#fcfcfb" },
  dark: { text: "#c3c2b7", muted: "#898781", grid: "#2c2c2a", surface: "#1a1a19" },
};
