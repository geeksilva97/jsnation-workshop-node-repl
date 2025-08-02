import { Model } from "objection";

export default class BaseModel extends Model {
  created_at!: Date;
  updated_at!: Date;

  $beforeInsert() {
    this.created_at = new Date();
    this.updated_at = this.created_at;
  }

  $beforeUpdate() {
    this.updated_at = new Date();
  }
}
