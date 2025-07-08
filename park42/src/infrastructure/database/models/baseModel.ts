import { Model } from "objection";

export default class BaseModel extends Model {
  createdAt!: Date;
  updatedAt!: Date;

  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}
