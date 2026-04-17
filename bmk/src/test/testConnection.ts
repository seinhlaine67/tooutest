import { supabase, callEdgeFunction } from "../lib/supabase";

export async function testDatabaseConnection() {
  console.log("Testing database connection...");

  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("*")
    .limit(5);

  if (seriesError) {
    console.error("Series query failed: ", seriesError);
  } else {
    console.log(`Found ${series?.length || 0} series`);
    console.log("Sample series: ", series?.[0]?.title);
  }

  const { data: episodes, error: episodeError } = await supabase
    .from("episodes")
    .select("*, series!series_latest_episode_id_fkey(title)")
    .limit(5);

  if (episodeError) {
    console.log("Episode query failed: ", episodeError);
  } else {
    console.log(`Found ${episodes.length || 0} episodes`);
  }

  try {
    const result = await callEdgeFunction("get-episode", {
      payload: { episode_id: "test-123" },
    });
    console.log("Edge function response: ", result);
  } catch (error) {
    console.log("Edge function test (expected error): ", error.message);
  }
}
