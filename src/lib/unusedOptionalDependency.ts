/**
 * Stand-in for jsPDF's optional dependencies (html2canvas, DOMPurify, canvg). They are only
 * used by jsPDF's HTML and SVG rendering, which this app never calls, so the build replaces
 * them with this empty module instead of shipping ~380 KB of unused code.
 */
export default undefined
