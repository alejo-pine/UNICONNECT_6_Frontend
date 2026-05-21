import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
  {
    method: "get",
    path: "/study-groups",
    alias: "getStudyGroups",
    description: `Retrieve a list of all available study groups`,
    requestFormat: "json",
    response: z
      .object({
        success: z.boolean(),
        data: z.array(
          z
            .object({ id: z.string().uuid(), name: z.string() })
            .partial()
            .passthrough()
        ),
      })
      .partial()
      .passthrough(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
