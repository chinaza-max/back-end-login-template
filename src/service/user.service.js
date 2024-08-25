import { 
  EmailandTelValidation,
  PropertyManager,
  Building,
  Transaction,
  Inspection,
  Tenant
} from "../db/models/index.js";
import userUtil from "../utils/user.util.js";
import bcrypt from'bcrypt';
import serverConfig from "../config/server.js";
import {  Op, Sequelize } from "sequelize";
import mailService from "../service/mail.service.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';


import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  SystemError

} from "../errors/index.js";
import { Console } from "console";
import { type } from "os";

class UserService {

  EmailandTelValidationModel=EmailandTelValidation
  PropertyManagerModel=PropertyManager
  BuildingModel=Building
  TenantModel=Tenant
  TransactionModel=Transaction
  InspectionModel=Inspection


  async handleUpdateProfile(data,file) {


    if(data.role=='list'){
      let { 
        userId,
        role,
        image,
        ...updateData
      } = await userUtil.verifyHandleUpdateProfileList.validateAsync(data);
      
      try {
        let imageUrl=''
        if(file){
          
          if(serverConfig.NODE_ENV == "production"){
            imageUrl =
            serverConfig.DOMAIN +
            file.path.replace("/home", "");
          }
          else if(serverConfig.NODE_ENV == "development"){
      
            imageUrl = serverConfig.DOMAIN+file.path.replace("public", "");
          }
    
        }


  
          if(file){

    
            await this.PropertyManagerModel.update({image:imageUrl  ,...updateData}, { where: { id: userId } });

  
          }else{

            await this.PropertyManagerModel.update(updateData, { where: { id: userId } });

          }

      } catch (error) {
        throw new SystemError(error.name,  error.parent)
      }
  
  
    }else{

      let { 
        userId,
        role,
        image,
        lasrraId,
        ...updateData
      } = await userUtil.verifyHandleUpdateProfileRent.validateAsync(data);
  

      try {
        if(lasrraId){
          await this.TenantModel.update({lasrraId,...updateData}, { where: { id: userId } });
  
        }else{
          await this.TenantModel.update({lasrraId:uuidv4(),...updateData}, { where: { id: userId } })
        }
      } catch (error) {
        throw new SystemError(error.name,  error.parent)

      }

    }


  }


  async handleListBuilding(data,files) {

    let { 
      userId,
      role,
      image,
      ...updateData
    } = await userUtil.verifyHandleListBuilding.validateAsync(data);
    
    let imageUrls = {
      bedroomSizeImage: "",
      kitchenSizeImage: "",
      livingRoomSizeImage: "",
      diningAreaSizeImage: "",
      propertyTerms: ""
    };


    try {

      if (files.bedroomSizeImage && files.bedroomSizeImage.length > 0) {
        const bedroomFile = files.bedroomSizeImage[0];
        imageUrls.bedroomSizeImage = serverConfig.NODE_ENV === "production"
          ? serverConfig.DOMAIN + bedroomFile.path.replace("/home", "")
          : serverConfig.DOMAIN + bedroomFile.path.replace("public", "");
      }
  
      // Handle kitchen image
      if (files.kitchenSizeImage && files.kitchenSizeImage.length > 0) {
        const kitchenFile = files.kitchenSizeImage[0];
        imageUrls.kitchenSizeImage = serverConfig.NODE_ENV === "production"
          ? serverConfig.DOMAIN + kitchenFile.path.replace("/home", "")
          : serverConfig.DOMAIN + kitchenFile.path.replace("public", "");
      }
  
      // Handle living room image
      if (files.livingRoomSizeImage && files.livingRoomSizeImage.length > 0) {
        const livingRoomFile = files.livingRoomSizeImage[0];
        imageUrls.livingRoomSizeImage = serverConfig.NODE_ENV === "production"
          ? serverConfig.DOMAIN + livingRoomFile.path.replace("/home", "")
          : serverConfig.DOMAIN + livingRoomFile.path.replace("public", "");
      }
  
      // Handle dining area image
      if (files.diningAreaSizeImage && files.diningAreaSizeImage.length > 0) {
        const diningAreaFile = files.diningAreaSizeImage[0];
        imageUrls.diningAreaSizeImage = serverConfig.NODE_ENV === "production"
          ? serverConfig.DOMAIN + diningAreaFile.path.replace("/home", "")
          : serverConfig.DOMAIN + diningAreaFile.path.replace("public", "");
      }
  
      // Handle property terms document
      if (files.propertyTerms && files.propertyTerms.length > 0) {
        const propertyTermsFile = files.propertyTerms[0];
        imageUrls.propertyTerms = serverConfig.NODE_ENV === "production"
          ? serverConfig.DOMAIN + propertyTermsFile.path.replace("/home", "")
          : serverConfig.DOMAIN + propertyTermsFile.path.replace("public", "");
      }     
      
      await this.BuildingModel.create({
        propertyManagerId:userId, 
        ...imageUrls, 
        ...updateData
      });

    } catch (error) {

      console.log(error )
      throw new SystemError(error.name,  error.parent)
    }

  }


  
  async handleInspectionAction(data) {

    let { 
    userId,
    role,
    type,
    page , 
    pageSize, 
    transactionId,
    inspectionId,
    buildingId,
    tenantId,
    inspectionMode,
    fullDate,
    inspectionStatus,
    inspectionDeclineMessage,
    emailAddress,
    tel,
    fullName,
    gender,
    note,
    } = await userUtil.verifyHandleInspectionAction.validateAsync(data);
    

    try {
      // Calculate offset for pagination
      const offset = (page - 1) * pageSize;
      const limit = pageSize;
  
      if (type === 'getNotCreatedInspection') {
        const notCreatedInspections = await this.InspectionModel.findAndCountAll({
          where: { inspectionStatus: 'notCreated', isDeleted: false },
          limit,
          offset,
        });
        return {
          data: notCreatedInspections.rows,
          totalItems: notCreatedInspections.count,
          currentPage: page,
          totalPages: Math.ceil(notCreatedInspections.count / pageSize),
        };
  
      } else if (type === 'getPendingInspection') {
        const pendingInspections = await this.InspectionModel.findAndCountAll({
          where: { inspectionStatus: 'pending', isDeleted: false },
          limit,
          offset,
        });
        return {
          data: pendingInspections.rows,
          totalItems: pendingInspections.count,
          currentPage: page,
          totalPages: Math.ceil(pendingInspections.count / pageSize),
        };
  
      } else if (type === 'getDeclineInspection') {
        const declinedInspections = await this.InspectionModel.findAndCountAll({
          where: { inspectionStatus: 'decline', isDeleted: false },
          limit,
          offset,
        });
        return {
          data: declinedInspections.rows,
          totalItems: declinedInspections.count,
          currentPage: page,
          totalPages: Math.ceil(declinedInspections.count / pageSize),
        };
  
      } else if (type === 'getAcceptedInspection') {
        const acceptedInspections = await this.InspectionModel.findAndCountAll({
          where: { inspectionStatus: 'accepted', isDeleted: false },
          limit,
          offset,
        });
        return {
          data: acceptedInspections.rows,
          totalItems: acceptedInspections.count,
          currentPage: page,
          totalPages: Math.ceil(acceptedInspections.count / pageSize),
        };
  
      } else if (type === 'createInspection') {

        const inspection = await this.InspectionModel.findOne({
          where: { id: inspectionId, isDeleted: false }
        });

        await inspection.update({
          userId,
          transactionId,
          buildingId,
          tenantId,
          inspectionMode,
          fullDate,
          emailAddress,
          tel,
          fullName,
          gender,
          inspectionStatus: 'pending',
        });
  
        return inspection;

       
  
      } else if (type === 'updateInspection') {
        const inspection = await this.InspectionModel.findOne({
          where: { id: inspectionId, isDeleted: false }
        });
  
        if (!inspection) {
          throw new Error('Inspection not found');
        }
  
        await inspection.update({
          inspectionStatus,
          inspectionDeclineMessage,
        });
  
        return inspection;
  
      } else {
        throw new Error('Invalid action type');
      }
    } catch (error) {

      throw new SystemError(error.name,  error.parent)

    }
 


  }
 


  async  sendEmailVerificationCode(emailAddress, userId ,password) {

    try {
      
        let keyExpirationMillisecondsFromEpoch = new Date().getTime() + 30 * 60 * 1000;
        const verificationCode =Math.floor(Math.random() * 9000000) + 100000;
    
        await this.EmailandTelValidationAdminModel.upsert({
          userId,
          type: 'email',
          verificationCode,
          expiresIn: new Date(keyExpirationMillisecondsFromEpoch),
        }, {
          where: {
            userId
          }
        });
    
        try {

          const params = new URLSearchParams();
                params.append('userId', userId);
                params.append('verificationCode',verificationCode);
                params.append('type', 'email');

            
            await mailService.sendMail({ 
              to: emailAddress,
              subject: "Account details and verification",
              templateName: "adminWelcome",
              variables: {
                password,
                email: emailAddress,
                domain: serverConfig.DOMAIN,
                resetLink:serverConfig.NODE_ENV==='development'?`http://localhost/COMPANYS_PROJECT/verifyEmail.html?${params.toString()}`: `${serverConfig.DOMAIN}/adminpanel/PasswordReset.html?${params.toString()}`
              },
            });
    
        } catch (error) {
            console.log(error)
        }
    
    
    } catch (error) {
      console.log(error);
    }

  }

  async generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
    let password = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }

    return password;
  }


}

export default new UserService();

//