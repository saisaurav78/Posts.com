const express = require("express");
const path = require("path");
const app = express();
const cookieparser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const upload = require("./utils/multer");
const methodOverride = require("method-override");
const UploadImg = require('./utils/cloudinary')


app.use(cookieparser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

dotenv.config();
const port = process.env.PORT || 3001;

const connection = require("./config/config")

 connection.connect((err) => {
  if (err) console.log(err);
  console.log("connected to db");
});



const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token; 

  if (!token) {
    return res.redirect("/login");
  }
  if (token)
  {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.redirect("/login");
      }
      req.user = decoded;
      next();
    });
  }
  else {
    req.user=null
    next()
  }
};


app.get("/add", isAuthenticated, (req, res) => {
  res.render("add",{user:req.user});
});

app.post("/add", isAuthenticated, upload.single("image"), async (req, res) => {
  const userId= req.user?req.user.userId:null
  let { title, category, content } = req.body
  const ImgUrl = req.file? await UploadImg(req.file.buffer):null
  
  try {
    const query = "INSERT INTO userposts(userId, title,category, content,img) VALUES (?,?,?,?,?)";
    connection.query(query, [userId,title,category, content, ImgUrl], (err) => {
      if (err) {
        console.log(err.message);
        res.render("failure.ejs", { failure: err.message });
      } else {
        res.render("success.ejs", {user:req.user});
      }
    });
  } catch (error) { 
    console.log(error);
  }
});

app.get(["/", "/home", "/posts"], (req, res) => {
  const token = req.cookies.token
  const query = `SELECT * FROM userposts  ORDER BY createdAt`;
  connection.query(query, (queryErr, queryResult) => {
    if (queryErr) {
      console.error(queryErr);
      return res.render("failure.ejs", { failure: queryErr.message });
    }
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (jwterr, jwtdecoded) => {
        if(jwterr) res.render("posts",{posts:queryResult, user:null})
        return res.render("posts", { posts: queryResult, user:jwtdecoded });
      })
    }
    else {
      return res.render("posts", { posts: queryResult, user: null });
    }
 
  });
});
app.get("/detail/:user",  (req, res) => {
  const token = req.cookies.token||null;
  const Id = parseInt(req.params.user, 10); 

  const postQuery = `SELECT * FROM userposts JOIN userdata ON userposts.userId=userdata.userId WHERE userposts.Id=?`;
  const commentsQuery = `SELECT * FROM comments JOIN userdata ON comments.userId=userdata.userId WHERE post_id = ?`;

  connection.query(postQuery, [Id], (postErr, postResult) => {
    if (postErr) {
      console.log(postErr);
      return res.render("failure.ejs", { failure: postErr.message });
    }
    connection.query(commentsQuery, [Id], (commentFetchErr, commentFetchRes) => {
      if (commentFetchErr) {
        console.log(commentFetchErr);
        return res.render("detail", { post: postResult[0], comments: null });
      }
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (jwtErr, jwtDecoded) => {
          if (jwtErr) {
            return res.render("detail", {
              post: postResult[0],
              comments: commentFetchRes,
              user: null
            });
          }
          res.render("detail", {
            post: postResult[0],
            comments: commentFetchRes,
            user: jwtDecoded
          });
        });
      } else {
        res.render("detail", {
          post: postResult[0],
          comments: commentFetchRes,
          user: null
        });
      }
    });
  });
});


app.get("/edit/:user", isAuthenticated, (req, res) => {
  const Id = parseInt(req.params.user);
  const query = `SELECT * from userposts WHERE Id=?`;
  try {
    connection.query(query, [Id], (err, result) => {
      if (err) {
        console.log(err);
        res.render("failure.ejs", { failure: err.message });
      } else {
        res.render("edit.ejs", { post: result[0] });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.patch("/submit/:user",isAuthenticated, upload.single("image"), async (req, res) => {
    const Id = parseInt(req.params.user);
    const{title,category,content}= req.body
    const newImg = req.file ? await UploadImg(req.file.buffer) : null
    const query = `UPDATE userposts SET title=? ,category=?, content = ?, img = ? WHERE Id = ?`;

    try {
      connection.query(query, [title,category,content, newImg, Id], (err) => {
        if (err) {
          return res.render("failure.ejs", { failure: err.message });
        }
        res.render("success.ejs");
      });
    } catch (error) {
      console.log(error);
      res.render("failure.ejs", { failure: "An unexpected error occurred" });
    }
  }
);

app.delete("/delete/:user", isAuthenticated, (req, res) => {
  const Id = parseInt(req.params.user);
  if (isNaN(Id)) {
    return res.render("failure.ejs", { failure: "Invalid user ID" });
  }
  const query = `DELETE FROM userposts WHERE Id= ?`;
  try {
    connection.query(query, [Id], (err) => {
      if (err) {
        res.render("failure.ejs", { failure: err.message });
      } else {
        res.render("success.ejs");
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/comment/:id", isAuthenticated, (req, res) => {
  const post_id = parseInt(req.params.id);
  const userId = req.user.userId;
  const comment = req.body.comment;

  const insertCommentQuery =
    "INSERT INTO comments(post_id, userId, comment) VALUES (?, ?, ?)";

  try {
    connection.query(insertCommentQuery, [post_id, userId, comment], (sqlerr) => {
      if (sqlerr) {
        console.error("SQL Error:", sqlerr.message); 
        res.send(sqlerr.message);
      } else {
        const fetchPostQuery = `SELECT * FROM userposts JOIN userdata ON userposts.userId=userdata.userId WHERE userposts.Id=?`;
        const fetchCommentsQuery = "SELECT * FROM comments JOIN userdata ON comments.userId = userdata.userId WHERE post_id = ? ";

        connection.query(fetchPostQuery, [post_id], (fetchPostErr, fetchPostRes) => {
          if (fetchPostErr) throw fetchPostErr;

          connection.query(fetchCommentsQuery, [post_id], (fetchCommentsErr, fetchCommentsRes) => {
            if (fetchCommentsErr) throw fetchCommentsErr;

            res.render("detail", {
              post: fetchPostRes[0],
              comments: fetchCommentsRes,
              user:req.user
            });
          });
        });
      }
    });
  } catch (error) {
    console.error("Catch Error:", error.message); 
    res.render("failure.ejs", { failure: error.message });
  }
});


app.post("/login", (req, res) => {
  res.clearCookie("token");
  const { username, password } = req.body;
  const query = `SELECT userId, username, password, profileImg FROM userdata where username=?`;
  connection.query(query, [username], (err, result) => {
    if (err) {
      console.log(err);
      return res.render("login", {user:null, failure: err.message });
    }
    if (result.length === 0)
      return res.render("login", { user:null,failure: "Account doesnot exist" });
    const hashedpass = result[0].password;
    bcrypt.compare(password, hashedpass, (bcrypterr, isMatch) => {
      if (bcrypterr) {
        console.error(bcrypterr);
        return res.render("login", {user:null, failure: bcrypterr });
      }
      if (!isMatch) {
        return res.render("login", {
          user:null,
          failure: "Invalid username or password"
        });
      }
      const payload = {
        userId: result[0].userId,
        user: result[0].username,
        profileImg: result[0].profileImg ? result[0].profileImg : "defaultProfile.jpg"
      };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (jwtErr, Token) => {
          if (jwtErr) {
            console.error(jwtErr);
            return res.render("failure.ejs", {user:null, failure: jwtErr.message });
          } else {
            res.cookie("token", Token, {
              httpOnly: true,
              secure: true,
              maxAge: 3600000,
              sameSite: "strict",
            });
            res.render("success.ejs");
          }
        }
      );
    });
  });
});

app.get("/login", (req, res) => {
  if (req.cookies.token) {
    jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.render("login.ejs", { user: "" , failure:null});
      }
      res.render("login.ejs", { user: decoded , failure:null});
    });
  } else {
    res.render("login.ejs", { user: "" , failure:null});
  }
});

app.get(["/dashboard","/update-profile"], isAuthenticated, (req, res) => {
  return res.render("dashboard",{user:req.user, msg:null})
});

app.post("/update-profile", isAuthenticated, upload.single('profileImg'), async (req, res) => {
  let cnfmpass  = req.body.cnfmpass
  const userId = req.user.userId;
  const profileImg = req.file ? await UploadImg(req.file.buffer): null;
  if (!cnfmpass && !profileImg) {
    return res.render("dashboard", { user: req.user, msg: 'No data updated' });
  }

  if (profileImg && !cnfmpass) {
    const query = 'UPDATE userdata SET profileImg=? WHERE userId=?';
    connection.query(query, [profileImg, userId], (queryErr) => {
      if (queryErr) {
        return res.render('dashboard', { user: req.user, msg: 'Failed to update profile image: ' + queryErr.code });
      }
    res.render('dashboard', { user: req.user, msg: 'Profile image updated successfully' });

    });
  }

  else if (!profileImg && cnfmpass) {
    bcrypt.hash(cnfmpass, 10, (bcrypterr, hashedPassword) => {
      if (bcrypterr) {
        return res.render('dashboard', { user: req.user, msg: 'An error occurred: ' + bcrypterr.message });
      }
      const query = 'UPDATE userdata SET password=? WHERE userId=?';
      connection.query(query, [hashedPassword, userId], (queryErr) => {
        if (queryErr) {
          return res.render('dashboard', { user: req.user, msg: 'Failed to update password: ' + queryErr.message });
        }
        return res.render('dashboard', { user: req.user, msg: 'Password updated successfully' });
      });
    });
  }

  else {
    bcrypt.hash(cnfmpass, 10, (bcrypterr, hashedPassword) => {
      if (bcrypterr) {
        return res.render('dashboard', { user: req.user, msg: 'An error occurred: ' + bcrypterr.message });
      }
      const query = 'UPDATE userdata SET profileImg=?, password=? WHERE userId=?';
      connection.query(query, [profileImg, hashedPassword, userId], (queryErr) => {
        if (queryErr) {
          return res.render('dashboard', { user: req.user, msg: 'Failed to update: ' + queryErr.message });
        }
        return res.render('dashboard', { user: req.user, msg: 'ProfileImg and password updated successfully' });
      });
    });
  }
});


app.post("/search", isAuthenticated, (req, res) => {
  const searchquery = req.body.searchquery || null;
  const action =
    "SELECT * FROM userposts WHERE content LIKE ? OR category LIKE ? OR title LIKE? OR Id= ?";
  connection.query(
    action,
    [`%${searchquery}%`, `%${searchquery}%`, `%${searchquery}%`, searchquery],
    (Db_err, Db_result) => {
      if (Db_err) res.render("failure.ejs", { failure: Db_err });
      else if (Db_result[0] == null) {
        res.render("posts.ejs", { posts: "", user:req.user });
      } else {
        res.render("posts.ejs", { posts: Db_result , user:req.user});
      }
    }
  );
});

app.get("/login/register/", (req, res) => {
  const query = 'SELECT * FROM userdata';
  connection.query(query, (queryErr, queryResult) => {
    if (queryErr) {
      console.error(queryErr);
      return res.render("register", { validation: queryErr.errno, user: null });
    }
    res.render("register", { validation: null, user: null });
  });
});

app.post("/register", upload.single("profileImg"), async (req, res) => {
  const profileImg = req.file ? await UploadImg(req.file.buffer) : null;
  const username = req.body.username
  let password = req.body.password
  const secret_answer= req.body.secret_answer

  bcrypt.hash(password, 10, (bcrypterr, bcryptres) => {
    if (bcrypterr) {
      console.error(bcrypterr);
      return res.render("failure.ejs", { failure: bcrypterr.message });
    }
    password = bcryptres;
    const query = `INSERT INTO userdata(username, password, secret_answer, profileImg) VALUES (?, ?, ?, ?)`;

    connection.query(query, [username, password, secret_answer, profileImg], (queryErr) => {
      if (queryErr) {
        if (queryErr.errno === 1062) {
          return res.render("register.ejs", { validation: 'user already exists', user: null });
        }
        console.error(queryErr);
        return res.render("failure.ejs", { failure: queryErr.message });
      }
      res.render("success");
    });
  });
});

app.get("/logout", isAuthenticated, (req, res) => {
  res.clearCookie("token")
  res.redirect("posts")
})

app.listen(port, () => {
  console.log(`listening on http://localhost:${process.env.PORT}`);
});
