import http from "k6/http";
import { sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 1 }, // ramp up to 1 VUs over 1 minute
  ],
};

export default function () {
  const url = "http://localhost:3000/api/notifications";
  const payload = JSON.stringify({
  "userId": `user1`,
  "channel": "email",
  "templateId": "welcome",
  "variables": { "name": "Jan" },
  "target": "jan@example.com"
});

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  http.post(url, payload, params);
  sleep(1); // small delay per VU iteration
}
