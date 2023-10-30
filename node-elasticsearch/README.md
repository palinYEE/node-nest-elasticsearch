## NodeJS 에서 Elasticseach 사용하기

* 사용 모듈: `@elastic/elasticsearch`
  * 설치 명령어: `npm install @elastic/elasticsearch`

* elasticsearch Client 기본 설정
  ```ts
  const client = new Client({
      node: 'http://localhost:9200',      // 엘라스틱서치 url
      // 만약 https 으로 셋팅 했다면 아래 auth 필드를 이용해서 엘라스틱서치의 접속 정보를 입력합니다.
      // auth: {
      //     apiKey: { // API key ID and secret
      //         id: 'foo',
      //         api_key: 'bar',
      //     }
      // }
      maxRetries: 5,                      /* 재시도 횟수를 설정할 수 있습니다. (default: 3) */
      requestTimeout: 60000,              /* 응답 요청 타임 아웃 시간을 정할 수 있습니다. (default: 30000) */
      sniffOnStart: true,                 /* 엘라스틱 서치의 sniffing 이라는 기능을 클라이언트 객체 생성때 진행합니다. */
  })
  ```

## 인덱스 관련 NodeJS 에서 사용할 수 있는 Elasticsearch API 

* `Client.ping()` : 설정한 Elasticsearch Client Cluster가 작동 중인지 확인하는 API 
  ```ts
  async function yjyoon_elasticsearch_module_init() {
    try {
        const pingResult = await client.ping()  // true or false
        console.log('Elasticsearch Client Setting SUCCESS')
        console.log(`Elasticsearch Ping Result: ${pingResult}`)
    } catch (error) {
        throw error
    }
  }
  ```
* `Client.indices.exists({index: ${인덱스 이름}})`: Elasitcsearch 에 입력한 인덱스가 있는지 확인하는 API
  ```ts
  const checkIndexExist = await client.indices.exists({index: indexName});
  if(!checkIndexExist) {
      res.status(400);
      res.send({
          "message": `입력하신 "${indexName}"은 이미 존재하는 인덱스 입니다.`,
      });
  }
  ```
* `Client.indices.create({index: ${인덱스 이름}, mapping?: ${mapping 정보}})`: Elasticsearch에 새로운 인덱스를 생성하는 API, mapping 정보 없이도 만들 수 있다.
  ```ts
  await client.indices.create({index: indexName, mappings: mapping});
  ```

## 데이터 관련 NodeJS 에서 사용할 수 있는 Elasticsearch API 

* `Client.index({index: ${데이터를 삽입할 인덱스 이름}, document: ${데이터}}})`: 사용자가 원하는 인덱스에 데이터를 삽입하는 API 
  ```ts
  await client.index({index: indexName, document: insertData});
  ```
* `Client.search({index: ${인덱스 이름}, query: ${검색 쿼리}, scroll: ${스크롤 데이터 유지 시간}})`: 데이터를 검색하는 API. 
  * search scroll 을 사용하기 위해서는 `Client.scroll({ scroll_id: body._scroll_id,scroll: '30s'})` API 를 사용해야 한다. 
  ```ts
  const allQuotes: SearchHit<unknown>[] = []
  const responseQueue: SearchResponse<unknown, Record<string, AggregationsAggregate>>[] = []
  const searchQuery: SearchRequest = {
    index: indexName, 
    query: query ? query: {}
  }
  if(scrollFlag) { searchQuery.scroll = '30s' }
  const searchResult = await client.search(searchQuery)
  responseQueue.push(searchResult);
  while(responseQueue.length) {
      const body = responseQueue.shift()!;

      body.hits.hits.forEach((hit) => {
          allQuotes.push(hit)
      });
      if(!scrollFlag) { break }

      let totalHits = 0; // totalHits를 기본값 0으로 초기화합니다.

      if (body.hits && body.hits.total) {
          // body.hits 또는 body.hits.total이 undefined가 아닌지 확인합니다.
          if (typeof body.hits.total === 'object') {
              // Elasticsearch 7.x 이상의 경우, total은 객체입니다.
              totalHits = body.hits.total.value;
          } else {
              // 이전 버전의 Elasticsearch에서는 total이 직접 숫자입니다.
              totalHits = body.hits.total;
          }
      } else {
          // body.hits 또는 body.hits.total이 없는 경우, 적절한 오류 메시지 또는 로깅을 수행할 수 있습니다.
          console.error("Unexpected response structure, 'hits' or 'total' field is missing.");
          throw new Error("Unexpected response structure, 'hits' or 'total' field is missing.")
      }

      if(totalHits === allQuotes.length) {
          break
      }

      responseQueue.push( await client.scroll({
          scroll_id: body._scroll_id,
          scroll: '30s'
      }));
  }
  ```
* `Client.delete({index: ${삭제할 데이터가 있는 인덱스 이름}, id: ${삭제할 도큐먼트 id}})`: 데이터를 삭제하는 API
  ```ts
  app.delete('/es/delete/data', checkElasticsearchIndexInBody, async (req: Request, res:Response) => {
    const indexName = req.body.index;
    const id = req.body.id;
    if(!id) {
        res.status(400);
        res.send({
            message: '삭제할 도큐먼트 id 값을 입력해주세요.'
        })
    }
    try {
        const deleteResult = await client.delete({id: id, index: indexName});
        res.send({
            message: `${indexName} 인덱스의 ${id} id 삭제 성공하였습니다.`,
            data: deleteResult
        })
    } catch (error) {
        res.status(400);
        res.send({
            message: (error as Error).message,
        });
    }
  });
  ```

## 참고 사이트

* [elasticsearch nodejs 메뉴얼 공식 문서](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/getting-started-js.html)
* [elasticsearch javascript api 메뉴얼](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html)
* [elasticsearch의 sniffing 기술이란 무엇인가.](https://www.elastic.co/kr/blog/elasticsearch-sniffing-best-practices-what-when-why-how)