import { describe, expect, it } from "vitest";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "./has-permission";

describe("hasPermission", () => {
  it("returns true when the exact permission is present", () => {
    expect(hasPermission(["CONTENT_VIEW", "CONTENT_EDIT"], "CONTENT_EDIT")).toBe(true);
  });

  it("returns false when the permission is absent", () => {
    expect(hasPermission(["CONTENT_VIEW"], "CONTENT_DELETE")).toBe(false);
  });

  it("returns false against an empty permission set", () => {
    expect(hasPermission([], "CONTENT_VIEW")).toBe(false);
  });

  it("does not wildcard or prefix-match — a longer key doesn't satisfy a shorter one", () => {
    expect(hasPermission(["CONTENT_VIEW_EXTRA"], "CONTENT_VIEW")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("returns true if at least one required permission is present", () => {
    expect(hasAnyPermission(["USER_VIEW"], ["ROLE_VIEW", "USER_VIEW"])).toBe(true);
  });

  it("returns false if none of the required permissions are present", () => {
    expect(hasAnyPermission(["USER_VIEW"], ["ROLE_VIEW", "ROLE_MANAGE"])).toBe(false);
  });

  it("returns false when required list is empty (nothing to satisfy vacuously)", () => {
    expect(hasAnyPermission(["USER_VIEW"], [])).toBe(false);
  });
});

describe("hasAllPermissions", () => {
  it("returns true only when every required permission is present", () => {
    expect(hasAllPermissions(["USER_VIEW", "USER_MANAGE"], ["USER_VIEW", "USER_MANAGE"])).toBe(true);
  });

  it("returns false if even one required permission is missing", () => {
    expect(hasAllPermissions(["USER_VIEW"], ["USER_VIEW", "USER_MANAGE"])).toBe(false);
  });

  it("returns true vacuously when nothing is required", () => {
    expect(hasAllPermissions(["USER_VIEW"], [])).toBe(true);
  });
});
