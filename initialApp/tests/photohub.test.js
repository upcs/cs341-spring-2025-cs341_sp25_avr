/**
 * @jest-environment node
 */

const fs = require("fs");
const path = require("path");

describe("photohub.tsx (file-level unit tests)", () => {
  let source;

  beforeAll(() => {
    const filePath = path.join(
      __dirname,
      "../../src/components/screens/photohub.tsx"
    );
    source = fs.readFileSync(filePath, "utf8");
  });

  test("contains Photo Hub screen title text", () => {
    // Flexible match so small formatting changes won't break the test
    expect(source).toMatch(/Photo\s*Hub/i);
  });

  test("contains onNavigate('home') navigation behavior", () => {
    // Looks for the home navigation callback usage
    expect(source).toMatch(/onNavigate\s*\(\s*['"]home['"]\s*\)/);
  });
});