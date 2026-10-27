package com.nexo.watch.data

import com.google.gson.JsonObject
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import java.util.concurrent.TimeUnit

interface NexoApi {
    @POST("pairing/code") suspend fun code(): JsonObject
    @GET("pairing/status/{token}") suspend fun status(@Path("token") token: String): JsonObject
    @GET("me") suspend fun me(@Header("Authorization") token: String): JsonObject
    companion object {
        fun create(origin: String): NexoApi = Retrofit.Builder().baseUrl("$origin/api/")
            .client(OkHttpClient.Builder().connectTimeout(15, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS).build())
            .addConverterFactory(GsonConverterFactory.create()).build().create(NexoApi::class.java)
    }
}
