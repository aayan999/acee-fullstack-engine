import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("[generateAccessAndRefreshTokens] Error:", error.message);
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};



const registerUser = asyncHandler(

    // This is the function that will be called when the user registers
    // Take the input from the user and create a new user
    // Validate the input
    // check if user already exists in the database
    // If user already exists, throw an error
    // If user does not exist, create a new user
    // remove the password and refresh token from the response
    // check for user creation
    // return the response

    async (req, res) => {
        const { username, email, password } = req.body;

        if ([email, username, password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required")
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new ApiError(400, "User already exists");
        }

        const user = await User.create({
            username,
            email,
            password
        })

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        return res.status(201).json(new ApiResponse(createdUser, "User created successfully"));
    }
)

const loginUser = asyncHandler(

    // This is the function that will be called when the user logs in
    // Take the input from the user and check if the user exists in the database
    // If user does not exist, throw an error
    // If user exists, check if the password is correct
    // If password is correct, generate access and refresh tokens
    // If password is incorrect, throw an error


    async (req, res) => {
        const { email, password } = req.body;

        if ([email, password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required")
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(400, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(400, "Password is incorrect");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged in successfully"
                )
            );
    }
)

const logoutUser = asyncHandler(
    async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        );

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse({}, "User logged out successfully"));
    }
)

// Logic for Refresh Token
// 1. Check if refresh token is present in the request
// 2. Check if refresh token is valid
// 3. Generate new access token and refresh token
// 4. Return new access token and refresh token

const refreshAccessToken = asyncHandler(
    async (req, res) => {
        const refreshTokenFromClient = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshTokenFromClient) {
            throw new ApiError(400, "Refresh token is required");
        }

        try {
            const decodedToken = jwt.verify(
                refreshTokenFromClient,
                process.env.REFRESH_TOKEN_SECRET
            );
            const user = await User.findById(decodedToken._id);

            if (!user) {
                throw new ApiError(400, "User does not exist");
            }

            if (refreshTokenFromClient !== user?.refreshToken) {
                throw new ApiError(400, "Invalid refresh token");
            }

            const options = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            }

            const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse(
                        {
                            accessToken, newRefreshToken
                        },
                        "Refresh token is valid"
                    )
                );

        } catch (error) {
            throw new ApiError(400, "Invalid refresh token");
        }
    }
)

export { registerUser, loginUser, logoutUser, refreshAccessToken };
