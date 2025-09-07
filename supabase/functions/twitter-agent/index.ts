import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { createHmac } from "node:crypto";

const twitterConsumerKey = Deno.env.get('TWITTER_CONSUMER_KEY');
const twitterConsumerSecret = Deno.env.get('TWITTER_CONSUMER_SECRET');
const twitterAccessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
const twitterAccessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function validateTwitterCredentials() {
  if (!twitterConsumerKey) throw new Error("Missing TWITTER_CONSUMER_KEY");
  if (!twitterConsumerSecret) throw new Error("Missing TWITTER_CONSUMER_SECRET");
  if (!twitterAccessToken) throw new Error("Missing TWITTER_ACCESS_TOKEN");
  if (!twitterAccessTokenSecret) throw new Error("Missing TWITTER_ACCESS_TOKEN_SECRET");
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  return hmacSha1.update(signatureBaseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string): string {
  const oauthParams = {
    oauth_consumer_key: twitterConsumerKey!,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: twitterAccessToken!,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    twitterConsumerSecret!,
    twitterAccessTokenSecret!
  );

  const signedOAuthParams = { ...oauthParams, oauth_signature: signature };
  const entries = Object.entries(signedOAuthParams).sort((a, b) => a[0].localeCompare(b[0]));

  return "OAuth " + entries
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

async function searchTwitter(query: string, maxResults: number = 10) {
  const searchUrl = 'https://api.x.com/2/tweets/search/recent';
  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    max_results: maxResults.toString(),
    'tweet.fields': 'author_id,created_at,public_metrics,context_annotations'
  });
  
  const fullUrl = `${searchUrl}?${params}`;
  const oauthHeader = generateOAuthHeader('GET', searchUrl);

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Authorization': oauthHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Twitter API error:', response.status, errorText);
    throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function postTweet(tweetText: string) {
  const url = 'https://api.x.com/2/tweets';
  const oauthHeader = generateOAuthHeader('POST', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': oauthHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: tweetText }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Twitter API error:', response.status, errorText);
    throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateTwitterCredentials();
    const { action, query, tweetText, maxResults } = await req.json();

    let result;
    
    if (action === 'search') {
      console.log('Searching Twitter for:', query);
      result = await searchTwitter(query, maxResults || 10);
    } else if (action === 'tweet') {
      console.log('Posting tweet:', tweetText);
      result = await postTweet(tweetText);
    } else {
      throw new Error('Invalid action. Use "search" or "tweet"');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in twitter-agent:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});