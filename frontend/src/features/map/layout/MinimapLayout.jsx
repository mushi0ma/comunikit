import { useContext } from "react";
import { AituMapContext } from "../AituMapContext";

// Dark theme fixed colors (no Chakra)
const BG = "#363636ff";
const STROKE = "#7f7f7f";
const STAIRS_FILL = "#1a202c";

const MinimapLayout = ({ children }) => {
  const { markers } = useContext(AituMapContext);

  const markerStyles = markers
    .map((m) => {
      const fill =
        m.type === "lost"
          ? "rgba(248, 113, 113, 0.45)"
          : "rgba(74, 222, 128, 0.45)";
      return `
        g[data-name="${m.roomId}"] polygon,
        g[data-name="${m.roomId}"] polyline,
        g[data-name="${m.roomId}"] line {
          fill: ${fill} !important;
        }
      `;
    })
    .join("\n");

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 347.52 354.54"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <style>{`
          .bg { stroke: ${STROKE}; fill: ${BG}; }
          .map-groups-stairs { fill: ${STAIRS_FILL}; pointer-events: none; }
          .map-groups-stairs polygon, .map-groups-stairs polyline { stroke: ${STROKE}; }
          .map-groups-stairs g path:nth-child(1) { fill: #007aff; }
          .map-groups-stairs g path:nth-child(2) { fill: #fff; }
          .map-groups-stairs-fill { fill: ${BG}; pointer-events: none; }
          .map-groups-stairs-fill polygon, .map-groups-stairs-fill polyline { stroke: ${STROKE}; }
          .map-groups-stairs-fill g path:nth-child(1) { fill: #007aff; }
          .map-groups-stairs-fill g path:nth-child(2) { fill: #fff; }
          .map-groups-gym path, .map-groups-gym line,
          .map-groups-gym polygon, .map-groups-gym polyline {
            stroke: ${STROKE} !important; fill: #4da2ff;
          }
          .map-groups-gym-pole path, .map-groups-gym-pole line,
          .map-groups-gym-pole polygon {
            stroke: ${STROKE}; stroke-miterlimit: 10; stroke-width: 0.75;
            fill: none !important;
          }
          .map-groups-rooms g line, .map-groups-rooms g polygon,
          .map-groups-rooms g polyline {
            stroke: ${STROKE}; fill: #4da2ff;
          }
          .map-groups-rooms g text, .map-groups-rooms g span,
          .map-groups-rooms g path {
            stroke: #ffffff !important; stroke-width: 0.1 !important;
            fill: #ffffff !important; color: #ffffff !important;
            font: 11px sans-serif; text-rendering: optimizeSpeed !important;
            pointer-events: none;
          }
          .map-groups-rooms g line:hover, .map-groups-rooms g polygon:hover,
          .map-groups-rooms g polyline:hover { opacity: 0.75; }
          .map-groups-techs polygon, .map-groups-techs polyline {
            stroke: ${STROKE}; fill: #bfbfbf; pointer-events: none;
          }
          .map-groups-techs-icon path:nth-child(1) { fill: #007aff; }
          .map-groups-techs-icon path:nth-child(2) { fill: #fff; }
          .map-groups-wcs polyline { stroke: ${STROKE}; fill: #ac7ab6; pointer-events: none; }
          .map-groups-wcs-icon path:nth-child(1) { fill: #007aff; }
          .map-groups-wcs-icon path:nth-child(2) { fill: #fff; }
          .map-groups-escapes polygon, .map-groups-escapes polyline {
            stroke: ${STROKE}; fill: #bfbfbf; pointer-events: none;
          }
          .map-groups-escapes-icon path:nth-child(1) { fill: #009245; }
          .map-groups-escapes-icon path:nth-child(2) { fill: #fff; }
          .room-map-group-search-target,
          .room-map-group-search-target line,
          .room-map-group-search-target polygon,
          .room-map-group-search-target polyline { fill: #62cf6b !important; }
          .map-groups-walls path, .map-groups-walls polyline,
          .map-groups-walls polygon, .map-groups-walls rect,
          .map-groups-walls line { stroke: ${STROKE}; fill: ${BG}; }
          .map-groups-void path, .map-groups-void polyline,
          .map-groups-void polygon, .map-groups-void rect,
          .map-groups-void line { stroke: ${STROKE}; fill: ${STAIRS_FILL}; }
          .map-groups-coworking-atameken path,
          .map-groups-coworking-atameken polygon,
          .map-groups-coworking-atameken polyline {
            stroke: ${STROKE}; fill: ${BG};
          }
          .label-huge { fill: ${STROKE} !important; color: ${STROKE} !important; stroke-width: 0.1 !important; }
          .label { fill: #ffffff !important; color: #ffffff !important; stroke-width: 0.1 !important; }
          .label-white { fill: #ffffff !important; color: #ffffff !important; stroke-width: 0.1 !important; }
          .map-groups-rooms-vk g line, .map-groups-rooms-vk g polygon,
          .map-groups-rooms-vk g polyline { stroke: ${STROKE}; fill: #61a166; }
          .map-groups-rooms-vk g text, .map-groups-rooms-vk g span,
          .map-groups-rooms-vk g path {
            stroke: #ffffff !important; stroke-width: 0.1 !important;
            fill: #ffffff !important; color: #ffffff !important;
            font: 11px sans-serif !important; text-rendering: optimizeSpeed !important;
            pointer-events: none;
          }
          .fit-text { font: 9px sans-serif !important; }
          ${markerStyles}
        `}</style>
      </defs>
      {children}
    </svg>
  );
};

export default MinimapLayout;
