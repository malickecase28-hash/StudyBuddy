import { expect, it } from "vitest";
import { formatValue } from "../src/format";

it("formats instrument readouts with 4 significant figures", () => {
  expect(formatValue(2)).toBe("2");
  expect(formatValue(-3)).toBe("-3");
  expect(formatValue(0)).toBe("0");
  expect(formatValue(0.159155)).toBe("0.1592");
  expect(formatValue(4493.8)).toBe("4494");
  expect(formatValue(1.5e-7)).toBe("1.500×10⁻⁷");
  expect(formatValue(123456)).toBe("1.235×10⁵");
  expect(formatValue(null)).toBe("—");
  expect(formatValue(Number.NaN)).toBe("—");
});
