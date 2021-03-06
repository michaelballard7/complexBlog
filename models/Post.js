const postsCollection = require("../db")
  .db()
  .collection("posts");

const ObjectID =  require('mongodb').ObjectID

const User = require('./User');

let Post = function(data, userId) {
  this.data = data
  this.errors = []
  this.userId = userId
};

Post.prototype.cleanInput = function() {
  // check to make sure input types are strings
  if (typeof this.data.title != "string") {
    this.data.title = ""
  }
  if (typeof this.data.body != "string") {
    this.data.body = ""
  }

  // get rid of any bogus properties
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createdAt: new Date(),
    author: ObjectID(this.userId)
  };
  console.log("data from inside cleanInput", this.data)
};

Post.prototype.validate = function() {
  if (this.data.title == "") {
    this.data.errors.push("You must enter a title");
  }
  if (this.data.body == "") {
    this.data.errors.push("You must provide us something this is coWriter!!!");
  }
  if (this.data.body.length < 10) {
    this.data.errors.push("Cmon right a post longer than 10 words");
  }
  if (this.data.body.length > 1000) {
    this.data.errors.push("Jesus, this is not a dissertation is it");
  }
  console.log("Data from inside of validate", this.data)
};

Post.prototype.create = function() {
    console.log("data from create", this.data);
  return new Promise((resolve, reject) => {
    this.cleanInput();
    this.validate();
    if (!this.errors.length) {
      // save  post into  database
      postsCollection
        .insertOne(this.data)
        .then(() => {
          console.log("Stored in the database",this.data);
          resolve();
        })
        .catch(() => {
          this.errors.push("Post failed, please try again later");
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

Post.findPostById =  function(id){
  return new Promise ( async function(resolve, reject){
    if(typeof(id) != 'string' || !ObjectID.isValid(id)){
      reject()
      return
    }
    // implement a search to find the post and user id from post and user documents
    let posts = await postsCollection.aggregate([
      {$match: {_id:new ObjectID(id)}},
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as:"authorDocument"}},
      {$project: {
        title:1,
        body:1,
        createdAt:1,
        author:{$arrayElemAt:["$authorDocument",0]}
      }}
    ]).toArray()

    // clean up the author property in post object
    posts.map((post)=>{
      console.log("from cleanpost obj", post);
      post.author = {
        username: post.author.username,
        profilePic: new User(post.author, true).profilePic
      }
    })

    if(posts.length){
      console.log(posts[0])
      resolve(posts[0]);
    }else{
      reject();
    }
  })
}

module.exports = Post;
