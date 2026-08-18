// Ambient declarations for CSS side-effect imports that ship no type
// declarations of their own. These packages are imported purely for their
// runtime stylesheet side effect (`import "pkg/style.css"`), so a blanket
// module declaration is sufficient — there is no runtime export to type.
declare module "@ncdai/react-wheel-picker/style.css"
declare module "maplibre-gl/dist/maplibre-gl.css"
