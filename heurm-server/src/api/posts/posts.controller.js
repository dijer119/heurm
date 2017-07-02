const Account = require('models/Account');
const Post = require('models/Post');
const Joi = require('joi');

exports.write = async (ctx) => {
    const { user } = ctx.request;

    if(!user) {
        // 비로그인 에러
        ctx.status = 403;
        ctx.body = { message: ' not logged in' };
        return;
    }

    let account;
    try {
        account = await Account.findById(user._id).exec();
    } catch (e) {
        ctx.throw(500, e);
    }
    
    const count = account.thoughtCount;

    // 스키마 검증하기
    const schema = Joi.object().keys({
        content: Joi.string().min(5).max(1000).required() // 5~1000 자
    });

    const result = Joi.validate(ctx.request.body, schema);

    if(result.error) {
        // 스키마 오류 발생
        ctx.status = 400; // Bad request
        return;
    }

    const { content } = ctx.request.body;

    let post;
    try {
        post = await Post.write({
            count,
            username: user.profile.username,
            content
        });
        await account.increaseThoughtCount();
    } catch (e) {
        ctx.throw(500, e);
    }

    ctx.body = post;
};

exports.list = async (ctx) => {
    const { cursor, username } = ctx.query; // URL 쿼리에서 cursor 와 username 값을 읽는다

    let posts = null;
    try {
        posts = await Post.list({ cursor, username });
    } catch (e) {
        ctx.throw(500, e);
    }

    const next = posts.length === 10 ? `/api/posts/?${username ? `username=${username}&` : ''}cursor=${posts[9]._id}` : null;

    ctx.body = {
        next,
        data: posts
    };
};