export type { Point, Triangle, SriYantraGeometry, MarmaPoint, SubTriangle, Avarana, PreparedGeometry, PreparedTriangle, PreparedLotus, PreparedBhupura, BaseRenderOptions, TargetUse, StrokeLinecap, } from "./types.js";
export { computeGeometry, getMinimalGeometry } from "./geometry.js";
export { computeMarmaPoints, segmentIntersection } from "./intersections.js";
export { prepareForRender, prepareMinimalForRender, prepareLotus, prepareBhupura, } from "./transform.js";
export { NINE_AVARANAS } from "./avaranas.js";
export { resolveFullYantraOptics, resolveMinimalMarkOptics, faviconOverrides, } from "./optical.js";
export type { OpticalProfile } from "./optical.js";
