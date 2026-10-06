package com.functions.alerts.clients;

import java.util.List;

import com.functions.alerts.models.ParsedErrorLog;

public interface NearbyLogFetcher {
    List<String> fetchNearby(ParsedErrorLog parsed);
}
