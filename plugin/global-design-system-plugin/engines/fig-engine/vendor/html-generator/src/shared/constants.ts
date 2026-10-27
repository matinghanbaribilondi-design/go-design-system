/**
 * Shared design constants for the converter pipeline.
 * Centralises magic numbers so behaviour is documented and tunable.
 */

/** Tolerance (px) when detecting optical centering of absolute text. */
export const CENTER_TOLERANCE_PX = 8;

/** Max width/height (px) for auto-SVG export of shape-only frames. */
export const MAX_AUTO_SVG_SIZE = 600;

/** Opacity epsilon — values above this are treated as fully opaque. */
export const OPAQUE_THRESHOLD = 0.999;

/** Default font stack (LTR) used across generated CSS. */
export const FONT_STACK_LTR = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

/** Default font stack (RTL) — Vazirmatn first for Persian/Arabic. */
export const FONT_STACK_RTL = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif`;

/** Fallback font chain appended after every Figma font family. */
export const FONT_FALLBACK_CHAIN = `'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

/** Background applied to the preview stage wrapper. */
export const PREVIEW_STAGE_BG = 'transparent';

/* ------------------------------------------------------------------ *
 * Fluid responsive policy
 *
 * Responsiveness is derived from the design itself — a value's own size and
 * the width it was drawn at — instead of from fixed viewport breakpoints.
 * Keeping the policy here means the converter never has to invent a magic
 * number inline, and every threshold can be reviewed in one place.
 * ------------------------------------------------------------------ */

/**
 * Fraction of its design value that a fluid length is allowed to shrink to.
 * 0.65 keeps type and spacing readable on a phone while still tracking the
 * viewport, rather than collapsing to an unusable size.
 */
export const FLUID_MIN_RATIO = 0.65;

/**
 * Design lengths below these (px) are emitted as fixed values. They are small
 * enough that scaling them would change the design more than it would help,
 * and they already read fine on a phone.
 */
export const FLUID_PADDING_MIN_PX = 32;
export const FLUID_GAP_MIN_PX = 24;
export const FLUID_FONT_MIN_PX = 28;

/**
 * Smallest comfortable inline size (px) a content column may shrink to before
 * a wrapping row pushes it onto its own line. Expressed as a `min-width` floor
 * so the browser reflows intrinsically — no breakpoint is involved.
 */
export const MIN_COLUMN_WIDTH_PX = 280;

/**
 * Size (px) at or below which a control (icon, avatar, dot, chip, small
 * button) keeps its intrinsic size instead of stretching or shrinking.
 */
export const INTRINSIC_CONTROL_MAX_PX = 64;

/**
 * Thresholds for detecting a multi-column row (cards, columns, sidebar +
 * content) that should be allowed to reflow. These describe geometry, not
 * breakpoints: they answer "is this a row of content blocks?".
 */
export const MULTI_COLUMN_MIN_WIDTH_PX = 460;
export const MULTI_COLUMN_MIN_CHILDREN_PX = 400;
export const SUBSTANTIAL_CHILD_MIN_PX = 120;
/** Width (px) that comfortably fits a phone viewport without reflowing. */
export const PHONE_FIT_WIDTH_PX = 340;
/** Height (px) up to which a horizontal row reads as a header/toolbar. */
export const HEADER_MAX_HEIGHT_PX = 96;

/**
 * A row this short, holding both an intrinsic control and a wide slot, is a
 * *bar* — a header, a toolbar, a status line — not a set of columns.
 *
 * A bar's children are not interchangeable blocks: a logo, a search field and a
 * pair of icon buttons do different jobs, and stacking them turns a header into
 * three full-width rows. A bar is therefore never a regions row and never a
 * grid; it keeps its single line and compresses its flexible slot instead.
 *
 * The test needs a control *and* a wide child because either one alone is
 * ambiguous: a row of five chips has no wide child (it is a tab strip), and a
 * 90px-tall card with an image, copy and a button has no control (it is a list
 * item that should compress, not a bar).
 */
export const TOOLBAR_WIDE_CHILD_MIN_PX = 200;

/**
 * Smallest inline size (px) a bar's flexible slot may shrink to before the bar
 * wraps it onto its own line.
 *
 * A search field squeezed to 40px is worse than a search field on its own row,
 * so the slot keeps a usable floor and the bar is allowed to wrap once that
 * floor no longer fits beside the fixed items. The value is a *usability* floor,
 * not a breakpoint: it is compared against the row's own content width by the
 * browser, at whatever width the row happens to be.
 */
export const TOOLBAR_SLOT_MIN_PX = 180;


/**
 * How different two siblings' widths must be before the row reads as layout
 * *regions* (a narrow rail beside a wide body) rather than a grid of repeated
 * items. Below this ratio the row is treated as a grid, whose children keep
 * their designed size when they wrap; a regions row instead lets each region
 * fill the line it lands on, so the stack reads as a single column.
 */
export const REGION_WIDTH_RATIO_MAX = 0.7;

/* ------------------------------------------------------------------ *
 * Implicit fill
 *
 * Figma's sizing flag is a weaker signal than the drawing itself. An input is
 * dragged until it reaches the end of its toolbar and left on `Fixed`; a card
 * image is dragged to the card's edge and left on `Fixed`; a body column is
 * drawn into exactly the space the rail left over. The geometry says "this
 * fills its container" long before the flag does, so the converter re-derives
 * the intent from the measurements rather than trusting the flag. That is what
 * lets any drawing stay responsive without the designer having to go back and
 * fix every layer.
 * ------------------------------------------------------------------ */

/**
 * Fraction of a row's inner main size that its in-flow children — plus the gaps
 * between them — must occupy for the row to read as *packed*: the children were
 * drawn to fill it, and whatever is left over is incidental rather than a gap
 * the designer wanted.
 *
 * Only a packed row may let its children grow. That is what stops a card that
 * wraps onto a line of its own from sitting at its designed width with dead
 * space beside it, while a row of deliberately small cards keeps its size.
 */
export const ROW_FILL_MIN_RATIO = 0.95;

/**
 * Slack (px) added to `ROW_FILL_MIN_RATIO`, so ordinary snapping and rounding
 * error cannot flip a row that was drawn full out of "packed".
 */
export const ROW_FILL_SLACK_PX = 4;

/**
 * Fraction of its parent's inner counter size a child must occupy to read as
 * spanning that axis. Designers routinely leave a layer on `Fixed` while
 * dragging it to 96–98% of its parent, or snap it a pixel or two short.
 */
export const COUNTER_FILL_MIN_RATIO = 0.96;

/** Slack (px) added to `COUNTER_FILL_MIN_RATIO`. */
export const COUNTER_FILL_SLACK_PX = 4;

/**
 * Fraction of its row's inner main size the largest child must occupy to read
 * as the row's one filling element — a search input beside an icon, a banner's
 * body beside its action. Below this the row is a set of peers rather than a
 * filler surrounded by details.
 */
export const DOMINANT_CHILD_MIN_RATIO = 0.5;

/**
 * Fraction of its freeform parent's width that a centred, absolutely-positioned
 * child must occupy to be treated as a full-width band. Such a child is pinned
 * to both edges instead of being locked to the width it was drawn at, so the
 * margin around it stays fluid when the frame is resized. Anything smaller is a
 * card, and keeps its drawn box.
 */
export const FREEFORM_SPAN_MIN_RATIO = 0.8;

/* ------------------------------------------------------------------ *
 * Absolute placement
 *
 * A layer that is out of flow is placed by hand, and Figma's constraint for it
 * is very often left at the default — pin to the top-left — even when the
 * drawing plainly says something else: a dialog in the middle of the page, a
 * badge hugging the right edge, a band flush with the bottom. Emitting `left`
 * and `top` for all of them freezes the placement at the size the frame
 * happened to be drawn at, which is the one thing a resize must not do. So the
 * anchor is read back from where the layer actually sits.
 * ------------------------------------------------------------------ */

/**
 * How far from an edge an absolutely-positioned layer may sit and still read as
 * anchored to it. The tolerance is the larger of a couple of pixels and a small
 * fraction of the parent, because the two cases that matter are different: a
 * badge inset 4px from a card's edge, and a hero inset by a 16px page margin.
 * A layer placed in the middle of its parent matches neither.
 */
export const EDGE_ANCHOR_TOLERANCE_PX = 2;
export const EDGE_ANCHOR_MIN_RATIO = 0.015;

/**
 * Maximum fraction of a freeform parent's axis a child may sit from its near
 * edge and still read as anchored to that edge (e.g. a floating action button
 * inset 24px from the bottom-right of an 800px screen, or a close button inset
 * 16px from the top-right of a 480px modal).
 */
export const QUADRANT_ANCHOR_MAX_RATIO = 0.12;
export const QUADRANT_ANCHOR_MAX_PX = 64;

/* ------------------------------------------------------------------ *
 * Freeform flow promotion
 *
 * Many Figma frames and sections are drawn with `layoutMode: NONE` even though
 * their children are arranged in a clean, non-overlapping row or column.
 * Leaving them as `position: absolute` freezes every child at its desktop
 * coordinates, so on a narrower viewport the children either collide or spill
 * off the right edge. When the geometry proves that the children form a
 * strict, non-overlapping 1D sequence, promoting the frame to a flex flow lets
 * the children reflow, wrap, and compress naturally while staying pixel-exact
 * at the design width.
 * ------------------------------------------------------------------ */

/**
 * Maximum overlap (px) tolerated between adjacent children when testing
 * whether a freeform frame's children form a non-overlapping sequence.
 * Allows subpixel rounding and 1px shared borders without mistaking true
 * layered compositions (scrims, badges over images) for a flow.
 */
export const FREEFORM_FLOW_OVERLAP_TOLERANCE_PX = 2;

/**
 * Minimum cross-axis alignment or span consistency required for freeform
 * children to read as a deliberate row or column rather than scattered items.
 */
export const FREEFORM_FLOW_ALIGN_TOLERANCE_PX = 6;

/* ------------------------------------------------------------------ *
 * Rotated dividers
 *
 * A divider is often drawn along one axis and then rotated a quarter turn to
 * stand on the other. Figma lays the rotated node out by its visual bounding
 * box; a CSS `transform` does not change the layout box at all. The rotation
 * therefore has to be read here, before any size is emitted.
 * ------------------------------------------------------------------ */

/**
 * How close to a multiple of 90° a rotation must be to count as orthogonal.
 * Figma stores rotations as floats, so a divider set to 90° in the UI can
 * arrive as 90.0000001; anything further off than this is a genuinely
 * diagonal line and stays a rotated graphic instead of a CSS border.
 */
export const ORTHOGONAL_ROTATION_EPSILON_DEGREES = 0.01;


/* ------------------------------------------------------------------ *
 * Tabular figures
 *
 * A column of numbers set in a proportional font has no vertical rhythm: a `1`
 * is narrower than a `4`, so the digits wander from row to row and the column
 * stops reading as a column. `font-variant-numeric: tabular-nums` pins every
 * digit to the same advance width, which is exactly what a table needs and
 * exactly what a sentence does not. The rule is therefore narrow: it fires only
 * when the layer is shaped like a table — stacked rows, equal cells, numbers in
 * them — so body copy is left alone.
 * ------------------------------------------------------------------ */

/** Rows a table must have before its figures are worth pinning. */
export const TABULAR_MIN_ROWS = 2;

/** Columns a table must have. A single column is a list. */
export const TABULAR_MIN_COLUMNS = 2;

/**
 * Share of the table's cells that must hold a number. A price column beside a
 * name column is still a table, so this is a majority rather than all of them.
 */
export const TABULAR_MIN_NUMERIC_SHARE = 0.6;
