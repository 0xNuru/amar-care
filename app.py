from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, usd

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///pharmacy.db")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
def index():
    all_products = db.execute("SELECT * FROM products LIMIT 4")
    return render_template("index.html", all_products=all_products)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("email"):
            return apology("Don't be sneaky! must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("Don't be sneaky! must provide password", 403)

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE email = ?",
                          request.form.get("email"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return apology("invalid email and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]
        print(session["user_id"])

        flash("Logged in")

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    flash("Logged out")

    # Redirect user to login form
    return redirect("/")


@app.route("/register", methods=["GET", "POST"])
def register():

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure email was submitted
        if not request.form.get("email"):
            return apology("must provide email", 400)

        # Ensure email doesn't exist
        rows = db.execute("SELECT email FROM users")
        print(rows)
        emails = []
        for row in rows:
            emails.append(row["email"])
        print(emails)
        if request.form.get("email") in emails:
            return apology("email already exists", 400)

        # Ensure password was submitted
        if not request.form.get("password"):
            return apology("must provide password", 400)

        # Ensure  passwords don't match
        if request.form.get("password") != request.form.get("confirmation"):
            return apology("passwords do not match", 400)

        # INSERT the new user into users
        hashed_password = generate_password_hash(request.form.get(
            "password"), method='pbkdf2:sha256', salt_length=8)
        created_email = request.form.get("email")
        address = request.form.get("address")
        db.execute("INSERT INTO users (email, hash, address) VALUES(:created_email, :hashed_password, :address)",
                   created_email=created_email, hashed_password=hashed_password, address=address)

        return redirect("/login")

    else:
        return render_template("register.html")


@app.route("/consultation")
def consultation():
    return render_template("consultation.html")


@app.route("/shop", methods=["GET", "POST"])
def shop():
    if request.method == "POST":
        product = request.form.get("product")
        product = "%" + product + "%"
        results = db.execute(
            "SELECT * FROM products WHERE name LIKE ?", product)
        return render_template("searched.html", results=results)

    all_products = db.execute("SELECT * FROM products")
    return render_template("shop.html", all_products=all_products)


@app.route("/order", methods=["GET", "POST"])
@login_required
def order():
    if request.method == "POST":
        product = request.form.get("product")
        user_id = session["user_id"]
        db.execute("INSERT INTO orders (userId, productId) VALUES(?, ?)", user_id, int(product))
        results = db.execute("SELECT DISTINCT * FROM orders JOIN products ON orders.productId=products.id WHERE userId = ?", user_id)
        return render_template("order.html", results=results)
    return render_template("order.html")


@app.route("/success", methods=["GET", "POST"])
@login_required
def success():
    if request.method == "POST":
        product = request.form.get("product")
        results = db.execute("SELECT * FROM products WHERE id = ?", product)
        amount = request.form.get("amount")
        available = results[0]["stock"]
        stock = results[0]["stock"] - int(amount)
        if int(amount) > stock:
            error = "we only have " + str(available) + " units left"
            return apology(error, 400)
        db.execute("UPDATE products SET stock = ? WHERE id = ?", stock, product)
        db.execute("DELETE FROM orders WHERE productId = ? AND userId = ?", product, session["user_id"])
        flash("SUCCESS!")
        return render_template("success.html", results=results)
    return render_template("success.html")


@app.route("/cart")
@login_required
def cart():
    user_id = session["user_id"]
    results = db.execute("SELECT DISTINCT * FROM orders JOIN products ON orders.productId=products.id WHERE userId = ?", user_id)
    return render_template("cart.html", results=results)

@app.route("/orders")
@login_required
def orders():
    user_id = session["user_id"]
    results = db.execute("SELECT DISTINCT * FROM orders JOIN products ON orders.productId=products.id WHERE userId = ?", user_id)
    return render_template("cart.html", results=results)


@app.route("/paid_appointments")
def paid_appointments():
    return render_template("paid_appointments.html")

@app.route("/free_appointments")
def free_appointments():
    return render_template("free_appointments.html")