# search-demo

A quick-and-dirty demo app for Couchbase FTS.  It does not use any Couchbase SDK, it just uses HTML/javascript and the Couchbase FTS REST APIs.

## How it works

There is a simple Go application which runs a web server.  This does two things:

- Serve static HTML files from the `static` folder
- Proxy requests from `/api` to the specified Couchbase Server FTS endpoint

## Build and Run

Because the static files are not packaged, you must run from this directory:

    go build
    ./search-demo

By default the demo will run on port 8099.  You can change this with the `-addr` flag.

By default it will proxy requests to `http://Administrator:password@localhost:9200` which is the default location for developer builds of Couchbase.  To change these settings, see the flags that start with `-proxyXYZ`.

## Current Configuration

The current configuration of this demo works with the `travel-sample` bucket.

You *MUST* also have an FTS index named `travel` with the following mapping:

```
{
  "type": "fulltext-index",
  "name": "travel",
  "uuid": "511d560a5a15c0a5",
  "sourceType": "couchbase",
  "sourceName": "travel-sample",
  "sourceUUID": "38c994c4975c98e0adc0d282fb513e9f",
  "planParams": {
    "maxPartitionsPerPIndex": 171
  },
  "params": {
    "doc_config": {
      "mode": "type_field",
      "type_field": "type"
    },
    "mapping": {
      "default_analyzer": "standard",
      "default_datetime_parser": "dateTimeOptional",
      "default_field": "_all",
      "default_mapping": {
        "dynamic": true,
        "enabled": true,
        "properties": {
          "geo": {
            "dynamic": false,
            "enabled": true,
            "fields": [
              {
                "analyzer": "",
                "include_in_all": true,
                "include_term_vectors": true,
                "index": true,
                "name": "geo",
                "store": true,
                "type": "geopoint"
              }
            ]
          },
          "name": {
            "dynamic": false,
            "enabled": true,
            "fields": [
              {
                "analyzer": "",
                "include_in_all": true,
                "include_term_vectors": true,
                "index": true,
                "name": "name",
                "store": true,
                "type": "text"
              }
            ]
          }
        }
      },
      "default_type": "_default",
      "index_dynamic": true,
      "store_dynamic": false,
      "type_field": "type"
    },
    "store": {
      "kvStoreName": "mossStore"
    }
  },
  "sourceParams": {}
}
```

## Customizing

The hope is that this demo can be easily tweaked/customized to work with other datasets and show off other search capabilities.
