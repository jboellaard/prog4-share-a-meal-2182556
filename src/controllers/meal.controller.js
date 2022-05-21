const dbconnection = require('../../database/dbconnection')
const Joi = require('joi')
const { logger } = require('../config/config')

const mealSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  isActive: Joi.boolean().required(),
  isVega: Joi.boolean().default('true'),
  isVegan: Joi.boolean().default('true'),
  isToTakeHome: Joi.boolean().required(),
  dateTime: Joi.string().required(),
  imageUrl: Joi.string().required(),
  allergenes: Joi.string()
    .required()
    .allow('')
    .pattern(
      new RegExp(
        '^(\\s*|"(gluten|noten|lactose)"(,("(gluten|noten|lactose)")){0,2})$'
      )
    ),
  maxAmountOfParticipants: Joi.number().required(),
  price: Joi.number().required(),
})

module.exports = {
  validateMeal: (req, res, next) => {
    logger.info('validateMeal called')

    const { error, value } = mealSchema.validate(req.body)
    if (error == undefined) {
      req.validatedMeal = value
      next()
    } else {
      logger.error(error.message)
      res.status(400).json({
        status: 400,
        message: error.message,
      })
    }
  },
  addMeal: (req, res, next) => {
    console.log('addMeal called')
    let meal = req.validatedMeal
    logger.info(meal)

    dbconnection.getConnection(function (err, connection) {
      if (err) {
        logger.error('connection error')
        const conError = {
          status: 500,
          message: err.sqlMessage,
        }
        next(conError)
      }
      logger.info('logged in user', req.userId)

      connection.query(
        'INSERT INTO meal (name,description,isActive,isVega,isVegan,isToTakeHome,dateTime,imageUrl,allergenes,maxAmountOfParticipants,price,cookId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?);',
        [
          meal.name,
          meal.description,
          meal.isActive,
          meal.isVega,
          meal.isVegan,
          meal.isToTakeHome,
          meal.dateTime,
          meal.imageUrl,
          meal.allergenes,
          meal.maxAmountOfParticipants,
          meal.price,
          req.userId,
        ],
        function (error, results, fields) {
          logger.info(results)

          if (error) {
            logger.error(error.sqlMessage)
            const conError = {
              status: 500,
              message: error.sqlMessage,
            }
            next(conError)
          } else {
            connection.query(
              'SELECT LAST_INSERT_ID() as mealId;',
              function (error, results, fields) {
                connection.release()
                if (error) {
                  logger.error(error.sqlMessage)
                  const conError = {
                    status: 500,
                    message: error.sqlMessage,
                  }
                  next(conError)
                }

                connection.query(
                  'INSERT INTO meal_participants_user VALUES (?,?)',
                  [results[0].mealId, req.userId],
                  function (error, results, fields) {
                    if (error) throw error
                  }
                )

                meal = {
                  id: results[0].mealId,
                  cookId: req.userId,
                  ...meal,
                }
                res.status(201).json({
                  status: 201,
                  result: meal,
                })
              }
            )
          }
        }
      )

      // dbconnection.end((err) => {
      //   console.log("Pool was closed.");
      // });
    })
  },
  getAllMeals: (req, res, next) => {
    console.log('getAllMeals called')

    dbconnection.getConnection(function (err, connection) {
      if (err) next(err)

      connection.query('SELECT * FROM meal', function (error, results, fields) {
        connection.release()

        if (error) {
          const err = {
            status: 500,
            message: error.sqlMessage,
          }
          next(err)
        } else {
          console.log('results = ', results.length)
          res.status(200).json({
            status: 200,
            result: results,
          })
        }

        // dbconnection.end((err) => {
        //   console.log("Pool was closed.");
        // });
      })
    })
  },
  getMealById: (req, res, next) => {
    console.log('getMealById called')
    const id = req.params.id
    console.log(id)
    dbconnection.getConnection(function (err, connection) {
      if (err) {
        const conError = {
          status: 500,
          message: err.sqlMessage,
        }
        next(conError)
      }

      connection.query(
        `SELECT * FROM meal WHERE id=${id};`,
        function (error, results, fields) {
          connection.release()

          if (error) {
            const err = {
              status: 500,
              message: error.sqlMessage,
            }
            next(err)
          } else {
            console.log('results = ', results.length)
            if (results.length > 0) {
              console.log(results)
              res.status(200).json({
                status: 200,
                result: results[0],
              })
            } else {
              const err = {
                status: 404,
                message: `Meal could not be found`,
              }
              next(err)
            }
          }

          // dbconnection.end((err) => {
          //   console.log("Pool was closed.");
          // });
        }
      )
    })
  },
  updateMeal: (req, res, next) => {
    logger.info('updateMeal called')
    const id = req.params.id
    dbconnection.getConnection(function (err, connection) {
      if (err) {
        const conError = {
          status: 500,
          message: err.sqlMessage,
        }
        next(conError)
      }

      connection.query(
        `SELECT * FROM meal WHERE id=?;`,
        [id],
        function (error, results, fields) {
          connection.release()
          if (error) {
            const err = {
              status: 500,
              message: error.sqlMessage,
            }
            next(err)
          } else {
            console.log('results = ', results.length)
            if (results.length > 0) {
              if (req.userId == results[0].cookId) {
                console.log(results[0])
                var meal = Object.assign({}, results[0])
                logger.info(new Date(meal.dateTime))
                logger.info(meal.allergenes)
                console.log(meal)
                const updateMealSchema = Joi.object({
                  name: Joi.string().required(),
                  description: Joi.string().default(`${meal.description}`),
                  isActive: Joi.boolean().default(`${meal.isActive}`),
                  isVega: Joi.boolean().default(`${meal.isVega}`),
                  isVegan: Joi.boolean().default(`${meal.isVegan}`),
                  isToTakeHome: Joi.boolean().default(`${meal.isToTakeHome}`),
                  dateTime: Joi.date().default(`${meal.dateTime}`),
                  imageUrl: Joi.string().default(`${meal.imageUrl}`),
                  allergenes: Joi.string()
                    .default(`${meal.allergenes}`)
                    .allow('')
                    .pattern(
                      new RegExp(
                        '^(//s*|"(gluten|noten|lactose)"(,("(gluten|noten|lactose)")){0,2})$'
                      )
                    ),
                  maxAmountOfParticipants: Joi.number().required(),
                  price: Joi.number().required(),
                })

                const { error, value } = updateMealSchema.validate(req.body)
                logger.debug(value.allergenes)
                const newDateTime = new Date(value.dateTime)
                logger.debug(newDateTime)
                if (error) {
                  const err = {
                    status: 400,
                    message: error.message,
                  }
                  next(err)
                } else {
                  console.log(value)
                  connection.query(
                    `UPDATE meal SET name=?,description=?,isActive=?,isVega=?,isVegan=?,isToTakeHome=?,dateTime=?,imageUrl=?,allergenes=?,maxAmountOfParticipants=?,price=? WHERE id=?`,
                    [
                      value.name,
                      value.description,
                      value.isActive,
                      value.isVega,
                      value.isVegan,
                      value.isToTakeHome,
                      newDateTime,
                      value.imageUrl,
                      value.allergenes,
                      value.maxAmountOfParticipants,
                      value.price,
                      id,
                    ],
                    function (error, results, fields) {
                      connection.release()

                      if (error) {
                        // logger.error(error.sqlMessage)
                        // const err = {
                        //   status: 500,
                        //   message: error.sqlMessage,
                        // }
                        // next(err)
                        res.status(500).json({
                          status: 500,
                          message: error.sqlMessage,
                        })
                      } else {
                        let meal = {
                          id: id,
                          cookId: req.userId,
                          ...value,
                        }
                        console.log(meal)
                        res.status(200).json({
                          status: 200,
                          result: meal,
                        })
                      }
                    }
                  )
                }
              } else {
                res.status(403).json({
                  status: 403,
                  message: `You are not authorized to alter this meal`,
                })
              }
            } else {
              res.status(404).json({
                status: 404,
                message: `Meal does not exist`,
              })
            }
          }

          // dbconnection.end((err) => {
          //   console.log("Pool was closed.");
          // });
        }
      )
    })
  },
  deleteMeal: (req, res, next) => {
    const id = req.params.id
    dbconnection.getConnection(function (err, connection) {
      if (err) {
        const conError = {
          status: 500,
          message: err.sqlMessage,
        }
        next(conError)
      }

      connection.query(
        `SELECT * FROM meal WHERE id=${id};`,
        function (error, results, fields) {
          connection.release()
          if (error) {
            const err = {
              status: 500,
              message: error.sqlMessage,
            }
            next(err)
          } else {
            console.log('results = ', results.length)
            if (results.length > 0) {
              if (results[0].cookId == req.userId) {
                connection.query(
                  `DELETE FROM meal WHERE id=${id};`,
                  function (error, results, fields) {
                    if (error) {
                      console.log(error.sqlMessage)
                      const err = {
                        status: 500,
                        message: error.sqlMessage,
                      }
                      next(err)
                    } else {
                      console.log('deleted')
                      res.status(200).json({
                        status: 200,
                        message: `Meal with id ${id} was deleted.`,
                      })
                    }
                  }
                )
              } else {
                res.status(403).json({
                  status: 403,
                  message: `You are not authorized to delete this meal`,
                })
              }

              // dbconnection.end((err) => {
              //   console.log("Pool was closed.");
              // });
            } else {
              res.status(404).json({
                status: 404,
                message: `Meal does not exist`,
              })
            }
          }
        }
      )
    })
  },
  participate: (req, res, next) => {
    dbconnection.getConnection(function (err, connection) {
      if (err) {
        logger.error('connection error')
        const conError = {
          status: 500,
          message: err.sqlMessage,
        }
        next(conError)
      }

      connection.query(
        'SELECT * FROM meal WHERE id=?',
        [req.params.id],
        function (error, results, fields) {
          if (error) throw error
          if (results.length == 0) {
            res.status(404).json({
              status: 404,
              message: 'Meal does not exist',
            })
          } else {
            connection.query(
              'SELECT * FROM meal_participants_user WHERE mealId=?',
              [req.params.id],
              function (error, results, fields) {
                if (error) throw error
                let numberOfParticipants = results.length
                participating = false
                results.forEach((i) => {
                  if (i.userId == req.userId) participating = true
                })
                if (results && participating) {
                  connection.query(
                    'DELETE FROM meal_participants_user WHERE mealId=? AND userId=?',
                    [req.params.id, req.userId],
                    function (error, results, fields) {
                      if (error) throw error
                      if (results.affectedRows > 0) {
                        res.status(200).json({
                          status: 200,
                          result: {
                            currentlyParticipating: false,
                            currentAmountOfParticipants:
                              numberOfParticipants - 1,
                          },
                        })
                      }
                    }
                  )
                } else if (results && !participating) {
                  connection.query(
                    'INSERT INTO meal_participants_user VALUES (?,?)',
                    [req.params.id, req.userId],
                    function (error, results, fields) {
                      if (error) throw error
                      if (results.affectedRows > 0) {
                        let participate = {}
                        res.status(200).json({
                          status: 200,
                          result: {
                            currentlyParticipating: true,
                            currentAmountOfParticipants:
                              numberOfParticipants + 1,
                          },
                        })
                      }
                    }
                  )
                }
              }
            )
          }
        }
      )
    })
  },
}
