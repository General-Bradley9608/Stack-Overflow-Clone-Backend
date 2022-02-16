const responseHandler = require('../helpers/responseHandler');
const { PostsModelSequelize } = require('../models/sequelize');

exports.create = async (newPost, result, tagDescription) => {
  const query = ` INSERT INTO posts(title,body,user_id) VALUES (?,?,?);
                  SET @v1 := (SELECT LAST_INSERT_ID());
                  INSERT IGNORE INTO tags(tagname, description) VALUES (?, ?);
                  SET @v2 := (SELECT id FROM tags WHERE tagname = ?);
                  INSERT INTO posttag(post_id,tag_id) VALUES(@v1,@v2);`;

  pool.query(
    query,
    [
      newPost.title,
      newPost.body,
      newPost.user_id,
      newPost.tagname,
      tagDescription,
      newPost.tagname,
    ],
    (err, res) => {
      if (err) {
        console.log('error: ', err);
        result(
          responseHandler(
            false,
            err.statusCode,
            err.message,
            null,
          ),
          null,
        );
        return;
      }
      result(
        null,
        responseHandler(true, 200, 'Post Created', res.insertId),
      );
    },
  );
};

exports.remove = (id, result) => {
  const query = ` DELETE FROM posttag WHERE post_id = ?;
                  DELETE FROM comments WHERE post_id = ?; 
                  DELETE FROM answers WHERE post_id = ?; 
                  DELETE FROM posts WHERE id = ? ;`;

  pool.query(query, [id, id, id, id], (err) => {
    if (err) {
      console.log('error: ', err);
      result(
        responseHandler(
          false,
          err.statusCode,
          err.message,
          null,
        ),
        null,
      );
      return;
    }
    result(
      null,
      responseHandler(true, 200, 'Post Removed', null),
    );
  });
};

exports.retrieveOne = async (postId, result) => {
  await PostsModelSequelize.increment('views',
    {
      by: 1,
      where: { id: postId },
    })
    .catch((error) => {
      console.log('error: ', error);
      result(
        responseHandler(
          false,
          error ? error.statusCode : 404,
          error ? error.message : 'There isn\'t any post by this id',
          null,
        ),
        null,
      );
      // eslint-disable-next-line no-useless-return
      return;
    });

  const query = `
  SELECT 
    posts.id, 
    posts.user_id, 
    tag_id, 
    COUNT(DISTINCT answers.id) as answer_count, 
    COUNT(DISTINCT comments.id) as comment_count, 
    username, 
    title, 
    posts.body as post_body, 
    tagname, 
    posts.created_at, 
    posts.views as views 
  FROM 
    posts 
    JOIN posttag ON posts.id = post_id 
    JOIN tags ON tag_id = tags.id 
    JOIN users ON user_id = users.id 
    LEFT JOIN answers ON answers.post_id = posts.id 
    LEFT JOIN comments ON posts.id = comments.post_id 
  WHERE 
    posts.id = ?;`;

  pool.query(query, postId, (err, results) => {
    if (err || results.length === 0) {
      console.log('error: ', err);
      result(
        responseHandler(
          false,
          err ? err.statusCode : 404,
          err ? err.message : 'There isn\'t any post by this id',
          null,
        ),
        null,
      );
      return;
    }
    result(
      null,
      responseHandler(true, 200, 'Success', results[0]),
    );
  });
};

exports.retrieveAll = (result) => {
  const query = `
  SELECT 
    posts.id, 
    posts.user_id, 
    username, 
    COUNT(DISTINCT answers.id) as answer_count, 
    COUNT(DISTINCT comments.id) as comment_count, 
    tag_id, 
    title, 
    posts.body, 
    tagname, 
    description, 
    posts.created_at, 
    posts.views 
  FROM 
    posts 
    JOIN posttag ON posts.id = post_id 
    JOIN tags ON tag_id = tags.id 
    JOIN users ON user_id = users.id 
    LEFT JOIN answers ON answers.post_id = posts.id 
    LEFT JOIN comments ON posts.id = comments.post_id 
  GROUP BY 
    posts.id 
  ORDER BY 
    posts.created_at DESC;`;

  pool.query(query, (err, results) => {
    if (err || results.length === 0) {
      console.log('error: ', err);
      result(
        responseHandler(
          false,
          err ? err.statusCode : 404,
          err ? err.message : 'There are no posts',
          null,
        ),
        null,
      );
      return;
    }
    result(null, responseHandler(true, 200, 'Success', results));
  });
};

exports.retrieveAllTop = (result) => {
  const query = `
  SELECT 
    posts.id, 
    posts.user_id, 
    username, 
    COUNT(DISTINCT answers.id) as answer_count, 
    COUNT(DISTINCT comments.id) as comment_count, 
    tag_id, 
    title, 
    posts.body, 
    tagname, 
    description, 
    posts.created_at, 
    posts.views 
  FROM 
    posts 
    JOIN posttag ON posts.id = post_id 
    JOIN tags ON tag_id = tags.id 
    JOIN users ON user_id = users.id 
    LEFT JOIN answers ON answers.post_id = posts.id 
    LEFT JOIN comments ON posts.id = comments.post_id 
  GROUP BY 
    posts.id 
  ORDER BY 
    answer_count DESC, 
    comment_count DESC;`;

  pool.query(query, (err, results) => {
    if (err || results.length === 0) {
      console.log('error: ', err);
      result(
        responseHandler(
          false,
          err ? err.statusCode : 404,
          err ? err.message : 'There are no posts',
          null,
        ),
        null,
      );
      return;
    }
    result(null, responseHandler(true, 200, 'Success', results));
  });
};

exports.retrieveAllTag = (tagName, result) => {
  const query = `
  SELECT 
    posts.id, 
    posts.user_id, 
    username, 
    COUNT(DISTINCT answers.id) as answer_count, 
    COUNT(DISTINCT comments.id) as comment_count, 
    tag_id, 
    title, 
    posts.body, 
    tagname, 
    description, 
    posts.created_at, 
    posts.views 
  FROM 
    posts 
    JOIN posttag ON posts.id = post_id 
    JOIN tags ON tag_id = tags.id 
    JOIN users ON user_id = users.id 
    LEFT JOIN answers ON answers.post_id = posts.id 
    LEFT JOIN comments ON posts.id = comments.post_id 
  WHERE 
    tags.tagname = ? 
  GROUP BY 
    posts.id 
  ORDER BY 
    posts.created_at DESC;`;

  pool.query(query, tagName, (err, results) => {
    if (err || results.length === 0) {
      console.log('error: ', err);
      result(
        responseHandler(
          false,
          err ? err.statusCode : 404,
          err ? err.message : 'There are no posts',
          null,
        ),
        null,
      );
      return;
    }
    result(null, responseHandler(true, 200, 'Success', results));
  });
};
