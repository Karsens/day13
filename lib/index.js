import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import Sequelize from 'sequelize';

// ===========CONNECTORS=============

const sequelize = new Sequelize('', '', '', {
  host: 'localhost',
  dialect: 'sqlite', // mysql eventually
  storage: 'db.sqlite',
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

const Post = sequelize.define('post', {
  user: {
    type: Sequelize.STRING,
  },
  text: {
    type: Sequelize.STRING,
  },
  channel: {
    type: Sequelize.STRING,
  },
});

Post.sync({ force: true }).then(() =>
  Post.create({
    user: 'John',
    text: 'Hoi hoi hoi',
    channel: 'Tarifa',
  }));

// ===========SCHEMA==============
const typeDefs = `
type Post {
  id: Int!
  user: String
  text: String
  channel: String
  createdAt: String
}

type Query {
  posts(channel: String!): [Post]
}

type Mutation {
  createPost (user: String!, text: String!, channel: String!): Post
}
`;

// ===========RESOLVERS==============
const resolvers = {
  Query: {
    posts: (_, { channel }) =>
      Post.findAll({
        where: { channel },
        order: [['createdAt', 'DESC']],
      }),
  },
  Mutation: {
    createPost: (_, { user, text, channel }) => {
      const post = Post.create({ user, text, channel });
      if (!post) {
        throw new Error("Couldn't create post");
      }
      return post;
    },
  },
};

// ============== EXECUTE ON EXPRESS ===============
const logger = { log: log => console.log(`KWERRIE:${log}`) };
const allowUndefinedInResolve = false;
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  logger,
  allowUndefinedInResolve,
});

const app = express();
const PORT = 3000;
const endpointURL = '/graphql';
app.use('/graphiql', graphiqlExpress({ endpointURL }));
app.use(endpointURL, bodyParser.json(), graphqlExpress({ schema }));
app.listen(PORT);
console.log(`We are listening on port ${PORT}`);
