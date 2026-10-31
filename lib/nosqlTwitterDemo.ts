export interface NosqlDemoConfig {
  id: string;
  name: string;
  badge: string;
  description: string;
  database: string;
  collectionCount: number;
  indexCount: number;
  highlight: string;
  createGraph: () => { nodes: any[]; edges: any[] };
}

export function getTwitterFullNosqlDemo(): { nodes: any[]; edges: any[] } {
  const nodes = [
    // 1. Users Collection
    {
      id: "coll-users",
      type: "NosqlCollectionNode",
      position: { x: 50, y: 140 },
      data: {
        label: "users",
        name: "users",
        database: "twitter_app_db",
        shardKey: "_id: hashed",
        fields: [
          { name: "_id", type: "ObjectId", required: true },
          { name: "username", type: "String (unique)", required: true },
          { name: "displayName", type: "String", required: true },
          { name: "email", type: "String (unique)", required: true },
          { name: "settings", type: "UserSettings (sub-doc)", required: false },
          { name: "bio", type: "String (max 160)", required: false },
          { name: "avatarUrl", type: "String", required: false },
          { name: "bannerUrl", type: "String", required: false },
          { name: "isVerified", type: "Boolean", required: false },
          { name: "followersCount", type: "Int32", required: true },
          { name: "followingCount", type: "Int32", required: true },
          { name: "tweetsCount", type: "Int32", required: true },
          { name: "pinnedTweetId", type: "ObjectId", required: false },
          { name: "createdAt", type: "Date", required: true },
        ],
      },
    },

    // 2. User Profile Settings (Embedded Sub-document in Users)
    {
      id: "embed-user-settings",
      type: "NosqlEmbeddedNode",
      position: { x: 50, y: 640 },
      data: {
        label: "UserSettings",
        name: "UserSettings",
        parentSchema: "users",
        isArray: false,
        fields: [
          { name: "isPrivate", type: "Boolean" },
          { name: "allowDmsFromAnyone", type: "Boolean" },
          { name: "contentFilterLevel", type: "String" },
          { name: "theme", type: "'dark' | 'dim' | 'light'" },
          { name: "language", type: "String" },
          { name: "twoFactorEnabled", type: "Boolean" },
        ],
      },
    },

    // 3. User Index
    {
      id: "idx-users-username",
      type: "NosqlIndexNode",
      position: { x: 50, y: -90 },
      data: {
        label: "idx_users_username_email",
        name: "idx_users_username_email",
        collectionName: "users",
        indexType: "Compound",
        keys: ["username: 1 (unique)", "email: 1 (unique)"],
      },
    },

    // 4. Follows Collection (Social Graph)
    {
      id: "coll-follows",
      type: "NosqlCollectionNode",
      position: { x: 50, y: 920 },
      data: {
        label: "follows",
        name: "follows",
        database: "twitter_app_db",
        shardKey: "{ followerId: 'hashed' }",
        fields: [
          { name: "_id", type: "ObjectId", required: true },
          { name: "followerId", type: "ObjectId", required: true },
          { name: "followingId", type: "ObjectId", required: true },
          { name: "notifyOnTweet", type: "Boolean", required: false },
          { name: "createdAt", type: "Date", required: true },
        ],
      },
    },

    // 5. Follows Unique Compound Index
    {
      id: "idx-follows-unique",
      type: "NosqlIndexNode",
      position: { x: 50, y: 1240 },
      data: {
        label: "idx_follows_pair_unique",
        name: "idx_follows_pair_unique",
        collectionName: "follows",
        indexType: "Compound",
        keys: ["followerId: 1", "followingId: 1 (unique)"],
      },
    },

    // 6. Reference: User to Tweets
    {
      id: "ref-user-tweets",
      type: "NosqlReferenceNode",
      position: { x: 440, y: 180 },
      data: {
        label: "Author_To_Tweets",
        name: "Author_To_Tweets",
        fromCollection: "tweets",
        fromField: "authorId",
        toCollection: "users",
        toField: "_id",
        cardinality: "1:N",
        refType: "ObjectId Reference",
      },
    },

    // 7. BSON Schema Validation for Tweets
    {
      id: "validator-tweet",
      type: "NosqlValidationNode",
      position: { x: 440, y: 580 },
      data: {
        label: "TweetBsonValidator",
        name: "TweetBsonValidator",
        collectionName: "tweets",
        validationLevel: "strict",
        validationAction: "error",
        requiredFields: ["_id", "authorId", "content", "createdAt"],
        rulesSummary: "content: string (1-280 chars), authorId: ObjectId, likeCount >= 0",
      },
    },

    // 8. Tweets Collection
    {
      id: "coll-tweets",
      type: "NosqlCollectionNode",
      position: { x: 780, y: 140 },
      data: {
        label: "tweets",
        name: "tweets",
        database: "twitter_app_db",
        shardKey: "{ authorId: 'hashed', createdAt: -1 }",
        fields: [
          { name: "_id", type: "ObjectId", required: true },
          { name: "authorId", type: "ObjectId", required: true },
          { name: "content", type: "String (<= 280 chars)", required: true },
          { name: "media", type: "Array<MediaAttachment>", required: false },
          { name: "replyToTweetId", type: "ObjectId", required: false },
          { name: "retweetOfTweetId", type: "ObjectId", required: false },
          { name: "quotedTweetId", type: "ObjectId", required: false },
          { name: "likeCount", type: "Int32", required: true },
          { name: "retweetCount", type: "Int32", required: true },
          { name: "replyCount", type: "Int32", required: true },
          { name: "hashtags", type: "Array<String>", required: false },
          { name: "mentions", type: "Array<String>", required: false },
          { name: "isEdited", type: "Boolean", required: false },
          { name: "createdAt", type: "Date", required: true },
        ],
      },
    },

    // 9. Compound Index on Tweets
    {
      id: "idx-tweets-timeline",
      type: "NosqlIndexNode",
      position: { x: 780, y: -90 },
      data: {
        label: "idx_tweets_author_created",
        name: "idx_tweets_author_created",
        collectionName: "tweets",
        indexType: "Compound",
        keys: ["authorId: 1", "createdAt: -1"],
      },
    },

    // 10. Media Attachment (Embedded Sub-document in Tweets)
    {
      id: "embed-tweet-media",
      type: "NosqlEmbeddedNode",
      position: { x: 780, y: 640 },
      data: {
        label: "MediaAttachment",
        name: "MediaAttachment",
        parentSchema: "tweets",
        isArray: true,
        fields: [
          { name: "mediaId", type: "String" },
          { name: "type", type: "'image' | 'video' | 'gif'" },
          { name: "url", type: "String" },
          { name: "thumbnailUrl", type: "String" },
          { name: "altText", type: "String" },
          { name: "aspectRatio", type: "String" },
          { name: "durationMs", type: "Int32" },
        ],
      },
    },

    // 11. Timelines / User Feeds Collection (Fan-out read model)
    {
      id: "coll-timelines",
      type: "NosqlCollectionNode",
      position: { x: 1180, y: 140 },
      data: {
        label: "timelines",
        name: "timelines",
        database: "twitter_app_db",
        shardKey: "{ userId: 'hashed', score: -1 }",
        fields: [
          { name: "_id", type: "ObjectId", required: true },
          { name: "userId", type: "ObjectId (timeline owner)", required: true },
          { name: "tweetId", type: "ObjectId", required: true },
          { name: "authorId", type: "ObjectId", required: true },
          { name: "score", type: "Double (ranking weight)", required: true },
          { name: "createdAt", type: "Date", required: true },
        ],
      },
    },

    // 12. Index on Timelines
    {
      id: "idx-timelines-fast-feed",
      type: "NosqlIndexNode",
      position: { x: 1180, y: -90 },
      data: {
        label: "idx_timelines_user_score",
        name: "idx_timelines_user_score",
        collectionName: "timelines",
        indexType: "Compound",
        keys: ["userId: 1", "score: -1", "createdAt: -1"],
      },
    },

    // 13. Notifications Collection
    {
      id: "coll-notifications",
      type: "NosqlCollectionNode",
      position: { x: 1180, y: 580 },
      data: {
        label: "notifications",
        name: "notifications",
        database: "twitter_app_db",
        shardKey: "{ recipientId: 'hashed', createdAt: -1 }",
        fields: [
          { name: "_id", type: "ObjectId", required: true },
          { name: "recipientId", type: "ObjectId", required: true },
          { name: "actorId", type: "ObjectId", required: true },
          { name: "type", type: "'like' | 'retweet' | 'reply' | 'follow'", required: true },
          { name: "tweetId", type: "ObjectId", required: false },
          { name: "isRead", type: "Boolean", required: true },
          { name: "createdAt", type: "Date", required: true },
        ],
      },
    },

    // 14. Sample Document JSON Preview
    {
      id: "doc-tweet-sample",
      type: "NosqlDocumentNode",
      position: { x: 1180, y: 980 },
      data: {
        label: "SampleTweetBson",
        name: "SampleTweetBson",
        collectionName: "tweets",
        sampleJson: `{\n  "_id": "65b9f1e4a3...",\n  "authorId": "65b8c2d10f...",\n  "content": "Designing real-time NoSQL database architectures with Schema Studio! 🚀 #nosql #mongodb",\n  "media": [\n    {\n      "type": "image",\n      "url": "https://cdn.twitter.com/media1.png",\n      "aspectRatio": "16:9"\n    }\n  ],\n  "likeCount": 1420,\n  "retweetCount": 389,\n  "hashtags": ["nosql", "mongodb"],\n  "createdAt": "2026-10-31T12:00:00Z"\n}`,
      },
    },
  ];

  const edges = [
    // 1. users._id dot -> Author_To_Tweets reference
    {
      id: "edge-users-to-ref",
      source: "coll-users",
      target: "ref-user-tweets",
      sourceHandle: "field-_id-right",
      targetHandle: "left",
      type: "erRelationship",
      data: {
        cardinality: "1:N",
        sourceRelation: "1",
        targetRelation: "N",
        label: "authors",
      },
    },

    // 2. Author_To_Tweets reference -> tweets.authorId dot
    {
      id: "edge-ref-to-tweets",
      source: "ref-user-tweets",
      target: "coll-tweets",
      sourceHandle: "right",
      targetHandle: "field-authorId-left",
      type: "erRelationship",
      data: {
        cardinality: "1:N",
        sourceRelation: "1",
        targetRelation: "N",
        label: "authorId",
      },
    },

    // 3. users (bottom) -> embed-user-settings (top)
    {
      id: "edge-users-to-settings",
      source: "coll-users",
      target: "embed-user-settings",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:1",
        sourceRelation: "1",
        targetRelation: "1",
        label: "embeds settings",
      },
    },

    // 4. idx-users-username (bottom) -> users (top)
    {
      id: "edge-index-to-users",
      source: "idx-users-username",
      target: "coll-users",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:1",
        sourceRelation: "1",
        targetRelation: "1",
        label: "unique index",
      },
    },

    // 5. users._id dot -> follows.followerId dot
    {
      id: "edge-users-to-follows",
      source: "coll-users",
      target: "coll-follows",
      sourceHandle: "field-_id-right",
      targetHandle: "field-followerId-left",
      type: "erRelationship",
      data: {
        cardinality: "1:N",
        sourceRelation: "1",
        targetRelation: "N",
        label: "followerId",
      },
    },

    // 6. coll-follows (bottom) -> idx-follows-unique (top)
    {
      id: "edge-follows-to-index",
      source: "coll-follows",
      target: "idx-follows-unique",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:1",
        sourceRelation: "1",
        targetRelation: "1",
        label: "pair index",
      },
    },

    // 7. coll-follows.followingId dot -> coll-tweets.authorId dot
    {
      id: "edge-follows-to-tweets",
      source: "coll-follows",
      target: "coll-tweets",
      sourceHandle: "field-followingId-right",
      targetHandle: "field-authorId-left",
      type: "erRelationship",
      data: {
        cardinality: "1:N",
        sourceRelation: "1",
        targetRelation: "N",
        label: "following tweets",
      },
    },

    // 8. idx-tweets-timeline (bottom) -> coll-tweets (top)
    {
      id: "edge-index-to-tweets",
      source: "idx-tweets-timeline",
      target: "coll-tweets",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:1",
        sourceRelation: "1",
        targetRelation: "1",
        label: "timeline index",
      },
    },

    // 9. coll-tweets.media dot -> embed-tweet-media (left)
    {
      id: "edge-tweets-to-media",
      source: "coll-tweets",
      target: "embed-tweet-media",
      sourceHandle: "field-media-right",
      targetHandle: "left",
      type: "erRelationship",
      data: {
        cardinality: "1:N",
        sourceRelation: "1",
        targetRelation: "N",
        label: "media array",
      },
    },

    // 10. coll-tweets (bottom) -> validator-tweet (top)
    {
      id: "edge-tweets-to-validator",
      source: "coll-tweets",
      target: "validator-tweet",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:1",
        sourceRelation: "1",
        targetRelation: "1",
        label: "validates tweet",
      },
    },

    // 11. coll-tweets._id dot -> coll-timelines.tweetId dot
    {
      id: "edge-tweets-to-timelines",
      source: "coll-tweets",
      target: "coll-timelines",
      sourceHandle: "field-_id-right",
      targetHandle: "field-tweetId-left",
      type: "erRelationship",
      data: {
        cardinality: "1:N",
        sourceRelation: "1",
        targetRelation: "N",
        label: "fan-out feed",
      },
    },

    // 12. idx-timelines-fast-feed (bottom) -> coll-timelines (top)
    {
      id: "edge-index-to-timelines",
      source: "idx-timelines-fast-feed",
      target: "coll-timelines",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:1",
        sourceRelation: "1",
        targetRelation: "1",
        label: "score index",
      },
    },

    // 13. coll-timelines (bottom) -> coll-notifications (top)
    {
      id: "edge-timelines-to-notifs",
      source: "coll-timelines",
      target: "coll-notifications",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:N",
        sourceRelation: "1",
        targetRelation: "N",
        label: "dispatches alerts",
      },
    },

    // 14. coll-notifications (bottom) -> doc-tweet-sample (top)
    {
      id: "edge-notifs-to-sample",
      source: "coll-notifications",
      target: "doc-tweet-sample",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "erRelationship",
      data: {
        cardinality: "1:1",
        sourceRelation: "1",
        targetRelation: "1",
        label: "sample document",
      },
    },
  ];

  return { nodes, edges };
}

export const NOSQL_DEMO_PRESETS: NosqlDemoConfig[] = [
  {
    id: "twitter-social-media",
    name: "Twitter / X Social Media Architecture",
    badge: "Production NoSQL",
    database: "twitter_app_db",
    collectionCount: 5,
    indexCount: 4,
    highlight: "Sharded collections (users, tweets, follows, feeds) with fan-out timeline cache, embedded media, compound indexes & strict validators.",
    description:
      "A complete real-world MongoDB / Document Store schema engineered for high-write concurrency, real-time fan-out home feeds, follower graphs, and rich media tweets.",
    createGraph: getTwitterFullNosqlDemo,
  },
];
