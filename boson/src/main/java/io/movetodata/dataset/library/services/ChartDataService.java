package io.movetodata.dataset.library.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.dataset.library.Keys.DatasetMappingKey;
import io.movetodata.dataset.library.chartfactory.ChartFactory;
import io.movetodata.dataset.library.chartfactory.IChartService;
import io.movetodata.dataset.library.models.ChartDataByIdsRequest;
import io.movetodata.dataset.library.models.DatasetMappingModel;
import io.movetodata.dataset.library.repository.DatasetMappingRepository;
import io.movetodata.dataset.requests.ChartDataRequest;
import io.movetodata.kepler.library.models.ChartKey;
import io.movetodata.kepler.library.models.ChartsModel;
import io.movetodata.kepler.library.models.ResourceVersionsModel;
import io.movetodata.kepler.library.repository.ChartsRepository;
import io.movetodata.kepler.library.repository.ResourceVersionsRepository;
import io.movetodata.kitab.library.enums.ResourceSubtype;
import io.movetodata.kitab.library.models.ResourceModel;
import io.movetodata.kitab.library.services.ResourceService;
import io.movetodata.passport.library.models.User;
import io.movetodata.passport.library.service.AuthzService;
import io.movetodata.passport.library.service.UserService;
import io.movetodata.platform.library.repository.CacheRepository;
import io.movetodata.platform.library.repository.PlatformConfigRepository;
import io.movetodata.sharedutils.Redis;
import io.movetodata.sharedutils.RedisKeyGenerator;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

import static io.movetodata.sharedutils.Redis.getCache;

@Service
public class ChartDataService {
    @Autowired
    ChartFactory chartFactory;
    @Autowired
    SparkDataService sparkDataService;
    @Autowired
    private ChartsRepository chartsRepository;
    @Autowired
    private ResourceVersionsRepository resourceVersionsRepository;
    @Autowired
    private DatasetMappingRepository datasetMappingRepository;
    @Autowired
    private AuthzService authzService;
    @Autowired
    private DatasetMappingService datasetMappingService;
    @Autowired
    private PlatformConfigRepository platformConfigRepository;
    @Autowired
    private ResourceService resourceService;
    @Autowired
    private UserService userService;
    @Autowired
    private CacheRepository cacheRepository;


    public Object getDataBySqlConfig(ChartDataRequest query, User user) throws Exception {
        if (query.getDatasetId() == null || query.getBranch() == null) {
            throw new UnsupportedOperationException("Broken Query! Contact Admin.");
        }

        // Check if Dataset Exists
        if (!resourceService.existsById(query.getDatasetId())) {
            throw new NoSuchElementException("Dataset/Live link with Id " + query.getDatasetId() + " does not exist");
        }

        Object res = new JSONObject();

        if (query.getSeries() == null && query.getMapSeries() == null) {
//            res.put("rows", 0);
//            res.put("trimmedData", false);
//            res.put("xAxis", new ArrayList<>());
//            res.put("yAxis", new ArrayList<>());
            return null;
        } else {
            res = this.getDataFromSparkOrCache(query, query.getUserLocale());
        }
        return res;
    }

    public void getChartDataByIds(ChartDataByIdsRequest chartDataByIdsRequest, UUID userId, JSONArray chartData, String userLocale) throws Exception {
        List<UUID> ids = chartDataByIdsRequest.getChartIds();

        for (UUID id : ids) {
            ResourceVersionsModel chartVersion = resourceVersionsRepository.getReferenceById(id);
            ChartKey chartKey = new ChartKey(id, chartVersion.getLatestVersionId());

            if (!chartsRepository.existsById(chartKey)) {
                throw new NoSuchElementException("No chart found for given Id");
            }
            if (resourceService.getResourceModel(id).getStatus().equals("inTrash")) {
                throw new NoSuchElementException("Restore chart to access it." + id);
            }

            JSONObject obj = new JSONObject();

            Optional<ChartsModel> chart = chartsRepository.findById(chartKey);
            ChartDataRequest chartDataRequest = null;
            if (chart.isPresent()) {
                // Getting latest transaction id for dataset
                Optional<DatasetMappingModel> mapping = datasetMappingRepository.findById(new DatasetMappingKey(chart.get().getChartConfig().getDatasetId(), chart.get().getChartConfig().getBranch()));
                if (mapping.isEmpty()) {
                    chartData.add(new JSONObject()); // dataset has no data loaded yet
                    continue;
                }
                chartDataRequest = DatasetService.converterOne(id, chart.get().getChartConfig(), chartDataByIdsRequest.getFilters(), chartDataByIdsRequest.getSaveInCache(), mapping.get().getCurrentTransaction());
            }

            // Check if Dataset Exists
            if (!resourceService.existsById(chartDataRequest.getDatasetId())) {
                throw new NoSuchElementException("Dataset with Id " + chartDataRequest.getDatasetId().toString() + " does not exist");
            }

            obj.put("chartState", chart);

            if (!authzService.isViewer(userId, id)) {
                obj.put("error", "Error : Access Denied");
            } else {
                obj.put("chartData", this.getDataFromSparkOrCache(chartDataRequest, userLocale));
            }

            chartData.add(obj);
        }
    }

    /**
     * Tries to get the data from redis cache, if it is not present it will get the data from spark and if the
     * saveInCache is true it will also save the data in cache
     *
     * @param chartDataRequest request to specify the details for fetching data
     * @param locale           locale for string type data conversion
     * @return JSONObject of the requested type
     * @throws Exception In case anything fails
     */
    public Object getDataFromSparkOrCache(ChartDataRequest chartDataRequest, String locale) throws Exception {
        if (Objects.isNull(chartDataRequest.getTransactionId()) || chartDataRequest.getTransactionId().toString().compareTo("00000000-0000-0000-0000-000000000000") == 0) {
            Optional<DatasetMappingModel> mapping = datasetMappingRepository.findById(new DatasetMappingKey(chartDataRequest.getDatasetId(), chartDataRequest.getBranch()));
            if (mapping.isEmpty()) {
                return null; // dataset has no data loaded yet — no transaction exists
            }
            chartDataRequest.setTransactionId(mapping.get().getCurrentTransaction());
        }

        // GET REDIS CACHE, if it is there ---------------------------------------------------------------------
        if (chartDataRequest.getChartUUID() != null && chartDataRequest.isFetchCachedData()) {
            String datasetCache = getCache(RedisKeyGenerator.chart(chartDataRequest), cacheRepository);

            if (datasetCache != null) {
                try {
                    JSONParser parser = new JSONParser();
                    JSONObject cachedData = (JSONObject) parser.parse(datasetCache);
                    cachedData.put("cachedData", true);
                    return cachedData;
                } catch (Exception ignored) {
                }
            }
        }
        // -----------------------------------------------------------------------------------------------------
        IChartService chartService = chartFactory.getChartService(chartDataRequest.getChartType());
        Object responseFromSpark = chartService.getChartData(chartDataRequest, locale);// this.getDataFromSpark(chartDataRequest, locale);

        ObjectMapper objectMapper = new ObjectMapper();

        ResourceModel datasetModel = resourceService.findById(chartDataRequest.getDatasetId()).orElseThrow();
        UUID currentTransaction = datasetMappingService.getCurrentTransaction(chartDataRequest.getDatasetId(), chartDataRequest.getBranch());

        // SAVE THE DATA IN CACHE IF saveInCache SET TRUE and chart is not live
        if (chartDataRequest.isSaveInCache() && !datasetModel.getSubType().equals(ResourceSubtype.LIVEDATASET) && chartDataRequest.getTransactionId().equals(currentTransaction)) {
            Redis.setCache(RedisKeyGenerator.chart(chartDataRequest), objectMapper.writeValueAsString(responseFromSpark), cacheRepository);
        }

        return responseFromSpark;
    }
}
