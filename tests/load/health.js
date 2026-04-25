import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // simulate ramp-up of traffic from 1 to 20 users
    { duration: '1m', target: 20 },   // stay at 20 users
    { duration: '30s', target: 0 },   // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

export default function () {
  const url = 'http://localhost:3000/api/health'; // Replace with critical path API when ready
  
  const res = http.get(url);
  
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
