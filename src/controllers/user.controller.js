import e from "express";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Resend } from "resend";
import jwt from "jsonwebtoken"

class userController {
  // register user
  registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    //validation
    if (username === "" || email === "" || password === "") {
      throw new ApiError(400, "Please fill all the fields");
    }

    // check if user exists

    const userExistsByUsername = await User.findOne({
      $and: [{ username }, { isVerified: true }],
    });
    if (userExistsByUsername) {
      throw new ApiError(400, "this username is taken");
    }

    const userExistsByEmail = await User.findOne({
      $and: [{ email }, { isVerified: true }],
    });
    if (userExistsByEmail) {
      throw new ApiError(400, "user with this email already exists");
    }

    const verifyCode = Math.round(Math.random() * 1000000).toString();

    const date = new Date();
    const verifyCodeExpiry = date.setHours(date.getHours() + 1);
    // save to database

    const user = await User.create({
      username,
      email,
      password,
      verifyCode,
      verifyCodeExpiry,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -verifyCode -verifyCodeExpiry"
    );

    if (!createdUser) {
      throw new ApiError(500, "Failed to register user");
    }

    // send verification code in email
    //  const resend = new Resend(process.env.RESEND_API_KEY);

    //  const { data, error } = await resend.emails.send({
    //   from: "onboarding@resend.dev",
    //   to: [email],
    //   subject: "Your Verification Code for the shopping card",
    //   html: `<strong>${verifyCode}</strong>`,
    // });

    // if (error) {
    //   console.log(error)
    //   throw new ApiError(400,"unable to send verification code")
    // }

    return res
      .status(201)
      .send(new ApiResponse(201, createdUser, "User created successfully"));
  });

  //generate refresh and access token

  generateRefreshAndAccessToken = async (userId) => {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (!user.isVerified) {
        throw new ApiError(401, "User is not verified");
      }

      const refreshToken = await user.generateRefreshToken();
      const accessToken = await user.generateAccessToken();

      user.refreshToken = refreshToken;

      await user.save({ validateBeforeSave: false });

      return { refreshToken, accessToken };
    } catch (error) {
      throw new ApiError(500, "unable to generate token");
    }
  };

  // verify user
  verifyUser = asyncHandler(async (req, res) => {
    const { username } = req.query;
    const { verifyCode } = req.body;

    const user = await User.findOne(username);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
      throw new ApiError(400, "User is already verified");
    }

    // check verify code
    if (user.verifyCode !== verifyCode) {
      throw new ApiError(401, "Invalid verification code");
    }

    // check verify code expiry
    const currDate = new Date();
    const verifyCodeExpiry = user.verifyCodeExpiry;

    const expiredHour =
      Math.abs(currDate - verifyCodeExpiry) / (1000 * 60 * 60);

    if (expiredHour > 1) {
      throw new ApiError(401, "Verification code has expired");
    }

    user.isVerified = true;

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { isVerified: user.isVerified },
          "user is verified"
        )
      );
  });

  // login user
  loginUser = asyncHandler(async (req, res) => {
    const { creator, password } = req.body;

    //validation
    if (!creator || !password) {
      throw new ApiError(400, "Please provide all required fields");
    }

    // find user exist
    const user = await User.findOne({
      $or: [{ username: creator }, { email: creator }],
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // check user is verified
    if (!user.isVerified) {
      throw new ApiError(401, "User is not verified");
    }

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid username or password");
    }

    // generate refresh and access token
    const { refreshToken, accessToken } =
      await this.generateRefreshAndAccessToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken -verifyCode -verifyCodeExpiry"
    );

    if (!loggedInUser) {
      throw new ApiError(404, "logged in user not found");
    }

    // set cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .send(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken },
          "user logged In successfully"
        )
      );
  });

  // refresh access token
  refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken =
      req.cookies.refreshToken ||
      req.headers["authorization"]?.replace("Bearer ", "");

    const decodeToken = jwt.verify(
      refreshToken,
      process.env.Refresh_Token_Secret
    );

    if (!decodeToken) {
      throw new ApiError(401, "Invalid refresh token Login Again");
    }

    const user = await User.findById(decodeToken._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(new ApiResponse(200,{}, "accessToken refreshed"));
  });

 
   // get current user
   getCurrentUser = asyncHandler(async (req, res) => {
      const user= await User.findById(req.user._id);
      if(!user){
        throw new ApiError(404,"User not found");
      }
      return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
   })

  //logOut
  logout = asyncHandler(async (req, res) => {})

  //change username or password
  updateProfile = asyncHandler(async (req, res) => {})
}

export default userController;
