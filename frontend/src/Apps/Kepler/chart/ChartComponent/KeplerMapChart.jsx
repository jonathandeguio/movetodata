import "leaflet/dist/leaflet.css";
import React, { useEffect, useMemo, useState } from "react";
import { Circle, MapContainer, Popup, TileLayer } from "react-leaflet";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import { useDispatch } from "react-redux";
import { getTheme, isDefined, isEmpty } from "utils/utilities";
import { PinIcon } from "../../../../assets/icons/mtdActionIcons";
import { ZoomToFitIcon } from "../../../../assets/icons/mtdNavigationIcon";
import MtdButton from "../../../../components/MtdComponents/ButtonComponent/MtdButton";
import { silentUpdateQuery } from "../../../../redux/actions/keplerActions";

const KeplerMapChart = ({ chartData, chartCustomization, query }) => {
  const [position, setPosition] = useState([0, 0]);
  const [zoom, setZoom] = useState(8);
  const [map, setMap] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const chartProvider =
    getTheme() === "dark"
      ? {
          url: "http://localhost:8081/tile/{z}/{x}/{y}{r}.png",
          attributtion:
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        }
      : {
          url: "http://localhost:8081/tile/{z}/{x}/{y}{r}.png",
          attributtion:
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        };

  const scatterColor = useMemo(
    () =>
      chartCustomization.scatterColor
        ? chartCustomization.scatterColor.toHexString()
        : "blue",
    [chartCustomization]
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (isDefined(map)) {
      if (!isDefined(query.mapCenter)) {
        const location =
          chartData?.mapChartData !== undefined &&
          chartData?.mapChartData[0] &&
          chartData?.latitude &&
          chartData?.longitude
            ? [
                chartData.mapChartData[0][chartData?.latitude],
                chartData.mapChartData[0][chartData?.longitude],
              ]
            : [0, 0];
        map.flyTo(location, 10);
      } else if (isDefined(query.mapCenter)) {
        map.flyTo(
          query.mapCenter.split(",").map((e) => Number(e)),
          query.mapZoom
        );
      }
    }

    return () => {
      if (isDefined(map)) {
        map.off();
        map.remove();
      }
    };
  }, [chartData, query, chartCustomization, map]);

  const toggleZoomToFullScreen = () => {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      var elem = document.getElementById("mapChart");
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE11 */
        elem.msRequestFullscreen();
      }
    }
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div id="mapChart">
      <div className="mapControls">
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexDirection: "column",
          }}
        >
          <MtdButton
            intent="primary"
            icononly
            onClick={() => toggleZoomToFullScreen()}
            icon={<ZoomToFitIcon />}
          />
          <MtdButton
            intent="primary"
            icononly
            onClick={() => {
              if (isDefined(query.mapCenter)) {
                dispatch(
                  silentUpdateQuery({
                    mapZoom: undefined,
                    mapCenter: undefined,
                  })
                );
              } else {
                dispatch(
                  silentUpdateQuery({
                    mapZoom: map.getZoom(),
                    mapCenter: `${map.getCenter().lat},${map.getCenter().lng}`,
                  })
                );
              }
            }}
            icon={<PinIcon />}
          />
        </div>
      </div>
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        whenCreated={(m) => {
          setMap(m);
        }}
      >
        <TileLayer
          attribution={chartProvider.attribution}
          url={chartProvider.url}
        />
        {isDefined(chartData?.mapChartData) &&
          chartData?.mapSeries?.map((seriesData, index) => {
            if (isDefined(seriesData?.layerType)) {
              if (seriesData?.layerType === "scatter") {
                return (
                  <>
                    {chartData.mapChartData?.map((data, index) => {
                      return (
                        <Circle
                          center={[
                            data[chartData.latitude],
                            data[chartData.longitude],
                          ]}
                          radius={10}
                          opacity={1}
                          color={scatterColor}
                        >
                          <Popup>
                            {Object.keys(data)
                              .filter((columnName) => {
                                if (isEmpty(seriesData?.dataColumns)) {
                                  return true;
                                } else {
                                  return seriesData.dataColumns.includes(
                                    columnName
                                  );
                                }
                              })
                              .map((k) => (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <strong>{k}:</strong>&nbsp;&nbsp;&nbsp;
                                  {data[k]}
                                </div>
                              ))}
                          </Popup>
                        </Circle>
                      );
                    })}
                  </>
                );
              } else if (seriesData?.layerType === "heatmap") {
                return (
                  <HeatmapLayer
                    points={chartData.mapChartData}
                    longitudeExtractor={(m) => m[chartData.longitude]}
                    latitudeExtractor={(m) => m[chartData.latitude]}
                    intensityExtractor={(m) =>
                      parseFloat(m[seriesData?.heatColumn])
                    }
                  />
                );
              } else {
                return <></>;
              }
            }
          })}
      </MapContainer>
    </div>
  );
};

export default KeplerMapChart;
