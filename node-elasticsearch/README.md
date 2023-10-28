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


## 참고 사이트

* [elasticsearch nodejs 메뉴얼 공식 문서](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/getting-started-js.html)
* [elasticsearch의 sniffing 기술이란 무엇인가.](https://www.elastic.co/kr/blog/elasticsearch-sniffing-best-practices-what-when-why-how)