/** Demo payload showcasing nesting, optional fields, null, unions and empty arrays. */
export const SAMPLE_JSON = `{
  "id": 101,
  "name": "John",
  "email": null,
  "isActive": true,
  "address": {
    "city": "New York",
    "zip": "10001",
    "geo": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  "tags": ["admin", "beta"],
  "orders": [
    {
      "orderId": "A-1001",
      "total": 49.99,
      "coupon": null,
      "items": [{ "sku": "X-1", "qty": 2 }]
    },
    {
      "orderId": "A-1002",
      "total": 5,
      "coupon": "SAVE10",
      "discount": 0.1,
      "items": []
    }
  ],
  "mixed": [1, "two", null]
}
`;
