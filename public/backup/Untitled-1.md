curl 'https://www.camelina-hub.org/api/getBucketObjectData?bucket_name=camelina&object_name=Plink%2FStraw_yield(g_per_plants)_INRAE.fam&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJndWVzdEB1bnR3aXN0LWh1Yi5vcmciLCJyb2xlIjoiUmV2aWV3ZXIiLCJleHAiOjE3NTc1MTE0NTV9.uLYigNqRHeq6huYseMftLGqdVoOslncKS9GHQUng5p8' \
  -X 'POST' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  -H 'DNT: 1' \
  -H 'Referer: https://www.camelina-hub.org/plink-worker.js' \
  -o "Straw_yield(g_per_plants)_INRAE.fam"


  curl 'https://www.camelina-hub.org/api/getBucketObjectData?bucket_name=camelina&object_name=Plink%2Fplink.genome&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJndWVzdEB1bnR3aXN0LWh1Yi5vcmciLCJyb2xlIjoiUmV2aWV3ZXIiLCJleHAiOjE3NTc1MTE0NTV9.uLYigNqRHeq6huYseMftLGqdVoOslncKS9GHQUng5p8' \
  -X 'POST' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  -H 'DNT: 1' \
  -H 'Referer: https://www.camelina-hub.org/plink-worker.js'\
  -o "plink.genome"


  curl 'https://www.camelina-hub.org/api/getBucketObjectData?bucket_name=camelina&object_name=Plink/precomputed.plink.cov.pca&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJndWVzdEB1bnR3aXN0LWh1Yi5vcmciLCJyb2xlIjoiUmV2aWV3ZXIiLCJleHAiOjE3NTc1MTE0NTV9.uLYigNqRHeq6huYseMftLGqdVoOslncKS9GHQUng5p8' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'Referer: https://www.camelina-hub.org/router?component=pca' \
  -H 'sec-ch-ua: "Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'DNT: 1' \
  -H 'Content-Type: application/json' \
  --data-raw '{"responseType":"text/plain"}' \
  -o "precomputed.plink.cov.pca"

  curl 'https://www.camelina-hub.org/api/assays?studyId=UNTWIST2.1&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJndWVzdEB1bnR3aXN0LWh1Yi5vcmciLCJyb2xlIjoiUmV2aWV3ZXIiLCJleHAiOjE3NTc1MTE0NTV9.uLYigNqRHeq6huYseMftLGqdVoOslncKS9GHQUng5p8' \
  -X 'POST' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'Referer: https://www.camelina-hub.org/router?component=pca' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'sec-ch-ua: "Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"' \
  -H 'DNT: 1' \
  -H 'sec-ch-ua-mobile: ?0'\
  -H 'Content-Type: application/json'\
  -o "assays.json"

